import { addDays, toISODate } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkoutById } from "@/services/workout-service";
import type {
  ExecutionDetail,
  ExecutionSummary,
  ExerciseLogWithExercise,
  HistoryEntry,
  HistoryFilters,
} from "@/types/workout";

function buildExecutionSummaries(
  executions: Array<{
    id: string;
    workout_id: string;
    user_id: string;
    executed_at: string;
    notes: string | null;
    completed: boolean;
    created_at: string;
  }>,
  workouts: Array<{
    id: string;
    name: string;
    category: ExecutionSummary["workout"]["category"];
    scheduled_days: ExecutionSummary["workout"]["scheduled_days"];
  }>,
  logs: Array<{ execution_id: string; completed: boolean }>,
): ExecutionSummary[] {
  const workoutById = new Map(workouts.map((workout) => [workout.id, workout]));
  const totalByExecutionId = new Map<string, number>();
  const completedByExecutionId = new Map<string, number>();

  logs.forEach((log) => {
    totalByExecutionId.set(log.execution_id, (totalByExecutionId.get(log.execution_id) ?? 0) + 1);
    completedByExecutionId.set(log.execution_id, (completedByExecutionId.get(log.execution_id) ?? 0) + (log.completed ? 1 : 0));
  });

  return executions.map((execution) => ({
    ...execution,
    workout: workoutById.get(execution.workout_id) ?? {
      id: execution.workout_id,
      name: "Treino removido",
      category: "musculacao",
      scheduled_days: ["monday"],
    },
    completedExercises: completedByExecutionId.get(execution.id) ?? 0,
    totalExercises: totalByExecutionId.get(execution.id) ?? 0,
  }));
}

export async function listExecutionHistory(userId: string, filters: HistoryFilters = {}): Promise<HistoryEntry[]> {
  const supabase = await createServerSupabaseClient();
  const from = filters.from ?? toISODate(addDays(new Date(), -60));
  const to = filters.to ?? toISODate(new Date());

  let executionsQuery = supabase
    .from("workout_executions")
    .select("*")
    .eq("user_id", userId)
    .gte("executed_at", `${from}T00:00:00`)
    .lte("executed_at", `${to}T23:59:59`)
    .order("executed_at", { ascending: false });

  if (filters.workoutId) {
    executionsQuery = executionsQuery.eq("workout_id", filters.workoutId);
  }

  const { data: executions, error: executionsError } = await executionsQuery;
  if (executionsError) throw executionsError;
  if (!executions.length) return [];

  const workoutIds = [...new Set(executions.map((execution) => execution.workout_id))];
  const executionIds = executions.map((execution) => execution.id);

  const [{ data: workouts, error: workoutsError }, { data: rawLogs, error: logsError }, { data: allWorkoutExecutions, error: allExecutionsError }] =
    await Promise.all([
      supabase.from("workouts").select("id, name, category, scheduled_days").in("id", workoutIds),
      supabase
        .from("exercise_logs")
        .select("id, execution_id, exercise_id, load_used, reps_done, duration_done, distance_done, notes, completed, created_at")
        .in("execution_id", executionIds),
      supabase
        .from("workout_executions")
        .select("id, workout_id, executed_at")
        .eq("user_id", userId)
        .in("workout_id", workoutIds)
        .order("executed_at", { ascending: false }),
    ]);

  if (workoutsError) throw workoutsError;
  if (logsError) throw logsError;
  if (allExecutionsError) throw allExecutionsError;

  const exerciseIds = [...new Set((rawLogs ?? []).map((log) => log.exercise_id))];
  const { data: exercises, error: exercisesError } = exerciseIds.length
    ? await supabase.from("exercises").select("id, name, video_url, is_priority, sets, reps, duration, distance").in("id", exerciseIds)
    : { data: [], error: null };

  if (exercisesError) throw exercisesError;

  const logsByExecutionId = new Map<string, ExerciseLogWithExercise[]>();
  const exerciseById = new Map((exercises ?? []).map((exercise) => [exercise.id, exercise]));

  (rawLogs ?? []).forEach((log) => {
    const current = logsByExecutionId.get(log.execution_id) ?? [];
    current.push({
      ...log,
      exercise: exerciseById.get(log.exercise_id) ?? {
        id: log.exercise_id,
        name: "Exercicio removido",
        video_url: null,
        is_priority: false,
        sets: null,
        reps: null,
        duration: null,
        distance: null,
      },
    });
    logsByExecutionId.set(log.execution_id, current);
  });

  const summaries = buildExecutionSummaries(executions, workouts ?? [], rawLogs ?? []);
  const workoutExecutionMap = new Map<string, Array<{ id: string; executed_at: string }>>();

  (allWorkoutExecutions ?? []).forEach((execution) => {
    const current = workoutExecutionMap.get(execution.workout_id) ?? [];
    current.push({ id: execution.id, executed_at: execution.executed_at });
    workoutExecutionMap.set(execution.workout_id, current);
  });

  return summaries.map((summary) => {
    const orderedExecutions = workoutExecutionMap.get(summary.workout.id) ?? [];
    const currentIndex = orderedExecutions.findIndex((execution) => execution.id === summary.id);
    const previousExecutionAt = currentIndex >= 0 ? orderedExecutions[currentIndex + 1]?.executed_at ?? null : null;

    return {
      ...summary,
      logs: logsByExecutionId.get(summary.id) ?? [],
      previousExecutionAt,
    };
  });
}

export async function getExecutionDetail(userId: string, executionId: string): Promise<ExecutionDetail | null> {
  const supabase = await createServerSupabaseClient();

  const { data: execution, error: executionError } = await supabase
    .from("workout_executions")
    .select("*")
    .eq("id", executionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (executionError) throw executionError;
  if (!execution) return null;

  const workout = await getWorkoutById(userId, execution.workout_id);
  if (!workout) return null;

  const { data: rawLogs, error: logsError } = await supabase
    .from("exercise_logs")
    .select("id, execution_id, exercise_id, load_used, reps_done, duration_done, distance_done, notes, completed, created_at")
    .eq("execution_id", execution.id);

  if (logsError) throw logsError;

  const exerciseIds = [...new Set((rawLogs ?? []).map((log) => log.exercise_id))];
  const { data: exercises, error: exercisesError } = exerciseIds.length
    ? await supabase.from("exercises").select("id, name, video_url, is_priority, sets, reps, duration, distance").in("id", exerciseIds)
    : { data: [], error: null };

  if (exercisesError) throw exercisesError;

  const exerciseById = new Map((exercises ?? []).map((exercise) => [exercise.id, exercise]));
  const logs: ExerciseLogWithExercise[] = (rawLogs ?? []).map((log) => ({
    ...log,
    exercise: exerciseById.get(log.exercise_id) ?? {
      id: log.exercise_id,
      name: "Exercicio removido",
      video_url: null,
      is_priority: false,
      sets: null,
      reps: null,
      duration: null,
      distance: null,
    },
  }));

  const { data: previousExecution, error: previousExecutionError } = await supabase
    .from("workout_executions")
    .select("id, executed_at")
    .eq("user_id", userId)
    .eq("workout_id", execution.workout_id)
    .lt("executed_at", execution.executed_at)
    .order("executed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousExecutionError) throw previousExecutionError;

  let previousLogsByExerciseId: Record<string, ExerciseLogWithExercise | undefined> = {};

  if (previousExecution) {
    const { data: previousRawLogs, error: previousLogsError } = await supabase
      .from("exercise_logs")
      .select("id, execution_id, exercise_id, load_used, reps_done, duration_done, distance_done, notes, completed, created_at")
      .eq("execution_id", previousExecution.id);

    if (previousLogsError) throw previousLogsError;

    previousLogsByExerciseId = Object.fromEntries(
      (previousRawLogs ?? []).map((log) => [
        log.exercise_id,
        {
          ...log,
          exercise: exerciseById.get(log.exercise_id) ?? {
            id: log.exercise_id,
            name: "Exercicio removido",
            video_url: null,
            is_priority: false,
            sets: null,
            reps: null,
            duration: null,
            distance: null,
          },
        },
      ]),
    );
  }

  return {
    execution,
    workout,
    logs,
    previousExecutionAt: previousExecution?.executed_at ?? null,
    previousLogsByExerciseId,
  };
}

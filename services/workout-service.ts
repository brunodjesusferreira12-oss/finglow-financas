import { DAY_ORDER } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentWorkoutDay, safePercentage, sortWorkoutDays } from "@/lib/utils";
import type {
  ExecutionSummary,
  Exercise,
  Workout,
  WorkoutExecution,
  WorkoutSection,
  WorkoutSummary,
  WorkoutWithSections,
  WeeklyScheduleItem,
} from "@/types/workout";

function buildWorkoutTrees(
  workouts: Workout[],
  sections: WorkoutSection[],
  exercises: Exercise[],
  executions: WorkoutExecution[],
): WorkoutWithSections[] {
  const sectionsByWorkoutId = new Map<string, WorkoutSection[]>();
  const exercisesBySectionId = new Map<string, Exercise[]>();
  const executionStatsByWorkoutId = new Map<
    string,
    {
      executionCount: number;
      completedCount: number;
      lastExecutionAt: string | null;
    }
  >();

  sections.forEach((section) => {
    const current = sectionsByWorkoutId.get(section.workout_id) ?? [];
    current.push(section);
    sectionsByWorkoutId.set(section.workout_id, current);
  });

  exercises.forEach((exercise) => {
    const current = exercisesBySectionId.get(exercise.section_id) ?? [];
    current.push(exercise);
    exercisesBySectionId.set(exercise.section_id, current);
  });

  executions.forEach((execution) => {
    const current = executionStatsByWorkoutId.get(execution.workout_id) ?? {
      executionCount: 0,
      completedCount: 0,
      lastExecutionAt: null,
    };

    current.executionCount += 1;
    current.completedCount += execution.completed ? 1 : 0;

    if (!current.lastExecutionAt || new Date(execution.executed_at) > new Date(current.lastExecutionAt)) {
      current.lastExecutionAt = execution.executed_at;
    }

    executionStatsByWorkoutId.set(execution.workout_id, current);
  });

  return workouts
    .map((workout) => {
      const workoutSections = (sectionsByWorkoutId.get(workout.id) ?? [])
        .sort((left, right) => left.order_index - right.order_index)
        .map((section) => ({
          ...section,
          exercises: (exercisesBySectionId.get(section.id) ?? []).sort((left, right) => left.order_index - right.order_index),
        }));

      const totalExercises = workoutSections.reduce((total, section) => total + section.exercises.length, 0);
      const stats = executionStatsByWorkoutId.get(workout.id);

      return {
        ...workout,
        scheduled_days: sortWorkoutDays(workout.scheduled_days),
        sections: workoutSections,
        totalExercises,
        executionCount: stats?.executionCount ?? 0,
        lastExecutionAt: stats?.lastExecutionAt ?? null,
        completionRate: safePercentage(stats?.completedCount ?? 0, stats?.executionCount ?? 0),
      };
    })
    .sort((left, right) => {
      const leftDay = DAY_ORDER.indexOf(left.scheduled_days[0] ?? "monday");
      const rightDay = DAY_ORDER.indexOf(right.scheduled_days[0] ?? "monday");

      if (leftDay !== rightDay) return leftDay - rightDay;
      return left.name.localeCompare(right.name, "pt-BR");
    });
}

function toWorkoutSummary(workout: WorkoutWithSections): WorkoutSummary {
  return {
    id: workout.id,
    name: workout.name,
    scheduled_days: workout.scheduled_days,
    category: workout.category,
    objective: workout.objective,
    notes: workout.notes,
    totalExercises: workout.totalExercises,
    executionCount: workout.executionCount,
    lastExecutionAt: workout.lastExecutionAt,
    completionRate: workout.completionRate,
  };
}

export async function listWorkouts(userId: string): Promise<WorkoutWithSections[]> {
  const supabase = await createServerSupabaseClient();

  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (workoutsError) throw workoutsError;
  if (!workouts.length) return [];

  const workoutIds = workouts.map((workout) => workout.id);

  const [{ data: sections, error: sectionsError }, { data: exercises, error: exercisesError }, { data: executions, error: executionsError }] =
    await Promise.all([
      supabase.from("workout_sections").select("*").in("workout_id", workoutIds).order("order_index", { ascending: true }),
      supabase.from("exercises").select("*").in("workout_id", workoutIds).order("order_index", { ascending: true }),
      supabase.from("workout_executions").select("*").eq("user_id", userId).in("workout_id", workoutIds),
    ]);

  if (sectionsError) throw sectionsError;
  if (exercisesError) throw exercisesError;
  if (executionsError) throw executionsError;

  return buildWorkoutTrees(workouts, sections ?? [], exercises ?? [], executions ?? []);
}

export async function getWorkoutById(userId: string, workoutId: string): Promise<WorkoutWithSections | null> {
  const workouts = await listWorkouts(userId);
  return workouts.find((workout) => workout.id === workoutId) ?? null;
}

export async function listWorkoutSummaries(userId: string): Promise<WorkoutSummary[]> {
  const workouts = await listWorkouts(userId);
  return workouts.map(toWorkoutSummary);
}

export async function getWeeklySchedule(userId: string): Promise<WeeklyScheduleItem[]> {
  const summaries = await listWorkoutSummaries(userId);

  return DAY_ORDER.map((day) => ({
    day,
    workouts: summaries.filter((workout) => workout.scheduled_days.includes(day)),
  }));
}

export async function getTodayWorkouts(userId: string): Promise<WorkoutSummary[]> {
  const currentDay = getCurrentWorkoutDay();
  const summaries = await listWorkoutSummaries(userId);
  return summaries.filter((workout) => workout.scheduled_days.includes(currentDay));
}

export async function listRecentExecutionSummaries(userId: string, limit = 5): Promise<ExecutionSummary[]> {
  const supabase = await createServerSupabaseClient();
  const { data: executions, error: executionsError } = await supabase
    .from("workout_executions")
    .select("*")
    .eq("user_id", userId)
    .order("executed_at", { ascending: false })
    .limit(limit);

  if (executionsError) throw executionsError;
  if (!executions.length) return [];

  const workoutIds = [...new Set(executions.map((execution) => execution.workout_id))];
  const executionIds = executions.map((execution) => execution.id);

  const [{ data: workouts, error: workoutsError }, { data: logs, error: logsError }] = await Promise.all([
    supabase.from("workouts").select("id, name, category, scheduled_days").in("id", workoutIds),
    supabase.from("exercise_logs").select("execution_id, completed").in("execution_id", executionIds),
  ]);

  if (workoutsError) throw workoutsError;
  if (logsError) throw logsError;

  const workoutById = new Map((workouts ?? []).map((workout) => [workout.id, workout]));
  const logsByExecutionId = new Map<string, number>();
  const completedByExecutionId = new Map<string, number>();

  (logs ?? []).forEach((log) => {
    logsByExecutionId.set(log.execution_id, (logsByExecutionId.get(log.execution_id) ?? 0) + 1);
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
    totalExercises: logsByExecutionId.get(execution.id) ?? 0,
  }));
}

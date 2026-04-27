import { addDays, extractNumericValue, getWeekKey, safePercentage, startOfWeek, toISODate } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EvolutionSnapshot } from "@/types/workout";

function buildWeeklyFrequency(executions: Array<{ executed_at: string }>) {
  const currentWeek = startOfWeek(new Date());
  const weeks = Array.from({ length: 8 }, (_, index) => addDays(currentWeek, (index - 7) * 7));
  const grouped = new Map<string, number>();

  executions.forEach((execution) => {
    const key = getWeekKey(new Date(execution.executed_at));
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  });

  return weeks.map((weekStart) => ({
    label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(weekStart),
    sessions: grouped.get(toISODate(weekStart)) ?? 0,
  }));
}

function buildCurrentStreak(executions: Array<{ executed_at: string }>) {
  const uniqueDays = [...new Set(executions.map((execution) => execution.executed_at.slice(0, 10)))].sort().reverse();
  if (!uniqueDays.length) return 0;

  const today = toISODate(new Date());
  const yesterday = toISODate(addDays(new Date(), -1));

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previousDay = new Date(`${uniqueDays[index - 1]}T00:00:00`);
    previousDay.setDate(previousDay.getDate() - 1);

    if (toISODate(previousDay) !== uniqueDays[index]) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export async function getEvolutionSnapshot(userId: string): Promise<EvolutionSnapshot> {
  const supabase = await createServerSupabaseClient();
  const { data: executions, error: executionsError } = await supabase
    .from("workout_executions")
    .select("id, executed_at, completed")
    .eq("user_id", userId)
    .order("executed_at", { ascending: true });

  if (executionsError) throw executionsError;

  const completedExecutions = (executions ?? []).filter((execution) => execution.completed);
  const executionIds = completedExecutions.map((execution) => execution.id);

  const { data: rawLogs, error: logsError } = executionIds.length
    ? await supabase
        .from("exercise_logs")
        .select("execution_id, exercise_id, load_used, completed")
        .in("execution_id", executionIds)
    : { data: [], error: null };

  if (logsError) throw logsError;

  const exerciseIds = [...new Set((rawLogs ?? []).map((log) => log.exercise_id))];
  const { data: exercises, error: exercisesError } = exerciseIds.length
    ? await supabase.from("exercises").select("id, name").in("id", exerciseIds)
    : { data: [], error: null };

  if (exercisesError) throw exercisesError;

  const exerciseById = new Map((exercises ?? []).map((exercise) => [exercise.id, exercise.name]));
  const executionDateById = new Map(completedExecutions.map((execution) => [execution.id, execution.executed_at]));

  const weeklyFrequency = buildWeeklyFrequency(completedExecutions);
  const bestWeek = weeklyFrequency.reduce((max, week) => Math.max(max, week.sessions), 0);
  const completionCalendarRange = Array.from({ length: 84 }, (_, index) => toISODate(addDays(new Date(), index - 83)));
  const calendarCountByDate = new Map<string, number>();

  completedExecutions.forEach((execution) => {
    const date = execution.executed_at.slice(0, 10);
    calendarCountByDate.set(date, (calendarCountByDate.get(date) ?? 0) + 1);
  });

  const performanceMap = new Map<string, { name: string; total: number }>();
  const loadCandidates = new Map<string, { name: string; values: Array<{ date: string; value: number }> }>();

  (rawLogs ?? []).forEach((log) => {
    if (!log.completed) return;

    const name = exerciseById.get(log.exercise_id);
    if (!name) return;

    const current = performanceMap.get(log.exercise_id) ?? { name, total: 0 };
    current.total += 1;
    performanceMap.set(log.exercise_id, current);

    const numericValue = extractNumericValue(log.load_used);
    const executedAt = executionDateById.get(log.execution_id);

    if (numericValue !== null && executedAt) {
      const series = loadCandidates.get(log.exercise_id) ?? { name, values: [] };
      series.values.push({ date: executedAt.slice(0, 10), value: numericValue });
      loadCandidates.set(log.exercise_id, series);
    }
  });

  const topSeries = [...loadCandidates.values()]
    .sort((left, right) => right.values.length - left.values.length)
    .slice(0, 4);

  const loadProgressMap = new Map<string, Record<string, string | number | null>>();

  topSeries.forEach((series) => {
    series.values.forEach((point) => {
      const current = loadProgressMap.get(point.date) ?? { date: point.date };
      current[series.name] = point.value;
      loadProgressMap.set(point.date, current);
    });
  });

  return {
    totalCompletedWorkouts: completedExecutions.length,
    currentStreak: buildCurrentStreak(completedExecutions),
    bestWeek,
    weeklyFrequency,
    loadProgressSeries: topSeries.map((series) => series.name),
    loadProgress: [...loadProgressMap.values()].sort((left, right) =>
      String(left.date).localeCompare(String(right.date), "pt-BR"),
    ),
    mostPerformedExercises: [...performanceMap.values()].sort((left, right) => right.total - left.total).slice(0, 6),
    completionCalendar: completionCalendarRange.map((date) => ({
      date,
      count: calendarCountByDate.get(date) ?? 0,
    })),
  };
}

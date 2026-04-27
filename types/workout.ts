import type { Database, Tables } from "@/types/database";

export type WorkoutDay = Database["public"]["Enums"]["workout_day"];
export type WorkoutCategory = Database["public"]["Enums"]["workout_category"];

export type Profile = Tables<"profiles">;
export type Workout = Tables<"workouts">;
export type WorkoutSection = Tables<"workout_sections">;
export type Exercise = Tables<"exercises">;
export type WorkoutExecution = Tables<"workout_executions">;
export type ExerciseLog = Tables<"exercise_logs">;

export type WorkoutSectionWithExercises = WorkoutSection & {
  exercises: Exercise[];
};

export type WorkoutWithSections = Workout & {
  sections: WorkoutSectionWithExercises[];
  totalExercises: number;
  executionCount: number;
  lastExecutionAt: string | null;
  completionRate: number;
};

export type WorkoutSummary = Pick<
  WorkoutWithSections,
  "id" | "name" | "scheduled_days" | "category" | "objective" | "notes" | "totalExercises" | "executionCount" | "lastExecutionAt" | "completionRate"
>;

export type ExecutionSummary = WorkoutExecution & {
  workout: Pick<Workout, "id" | "name" | "category" | "scheduled_days">;
  completedExercises: number;
  totalExercises: number;
};

export type ExerciseLogWithExercise = ExerciseLog & {
  exercise: Pick<Exercise, "id" | "name" | "video_url" | "is_priority" | "sets" | "reps" | "duration" | "distance">;
};

export type HistoryFilters = {
  from?: string;
  to?: string;
  workoutId?: string;
};

export type HistoryEntry = ExecutionSummary & {
  logs: ExerciseLogWithExercise[];
  previousExecutionAt: string | null;
};

export type ExecutionDetail = {
  execution: WorkoutExecution;
  workout: WorkoutWithSections;
  logs: ExerciseLogWithExercise[];
  previousExecutionAt: string | null;
  previousLogsByExerciseId: Record<string, ExerciseLogWithExercise | undefined>;
};

export type WeeklyScheduleItem = {
  day: WorkoutDay;
  workouts: WorkoutSummary[];
};

export type DashboardSnapshot = {
  userName: string;
  totalWorkouts: number;
  weeklySessions: number;
  totalExercises: number;
  completedThisMonth: number;
  completionRate: number;
  todayWorkouts: WorkoutSummary[];
  recentExecutions: ExecutionSummary[];
  weeklySchedule: WeeklyScheduleItem[];
  weeklyProgress: Array<{
    label: string;
    completed: number;
    planned: number;
  }>;
  topExercises: Array<{
    name: string;
    count: number;
    lastLoad: string | null;
  }>;
};

export type LoadProgressPoint = {
  date: string;
  [key: string]: string | number | null;
};

export type EvolutionSnapshot = {
  totalCompletedWorkouts: number;
  currentStreak: number;
  bestWeek: number;
  weeklyFrequency: Array<{
    label: string;
    sessions: number;
  }>;
  loadProgressSeries: string[];
  loadProgress: LoadProgressPoint[];
  mostPerformedExercises: Array<{
    name: string;
    total: number;
  }>;
  completionCalendar: Array<{
    date: string;
    count: number;
  }>;
};

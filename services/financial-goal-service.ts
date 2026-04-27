import { calculatePercentage, safeNumber } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FinancialGoalProgress, FinancialGoalsSnapshot, FinancialGoalWithCategory } from "@/types/finance";

type RawFinancialGoal = FinancialGoalWithCategory;

const STATUS_RANK = {
  in_progress: 0,
  paused: 1,
  completed: 2,
} as const;

const PRIORITY_RANK = {
  high: 0,
  medium: 1,
  low: 2,
} as const;

function getDaysRemaining(deadline: string, referenceDate = new Date()) {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const target = new Date(`${deadline}T00:00:00`);
  const diffMs = target.getTime() - today.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function toGoalProgress(goal: FinancialGoalWithCategory): FinancialGoalProgress {
  const targetAmount = safeNumber(goal.target_amount);
  const currentAmount = safeNumber(goal.current_amount);
  const cappedCurrent = Math.min(currentAmount, targetAmount);
  const progressPercentage = calculatePercentage(cappedCurrent, targetAmount);
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);
  const daysRemaining = getDaysRemaining(goal.deadline);
  const isOverdue = goal.status !== "completed" && daysRemaining < 0;
  const isNearDeadline = goal.status !== "completed" && daysRemaining >= 0 && daysRemaining <= 14;

  return {
    ...goal,
    targetAmount,
    currentAmount,
    progressPercentage,
    remainingAmount,
    daysRemaining,
    deadlineTone: isOverdue ? "danger" : isNearDeadline ? "warning" : "safe",
    isNearDeadline,
    isOverdue,
    isAchieved: currentAmount >= targetAmount,
  };
}

function sortGoals(goals: FinancialGoalProgress[]) {
  return [...goals].sort((left, right) => {
    const statusRankDiff = STATUS_RANK[left.status] - STATUS_RANK[right.status];
    if (statusRankDiff !== 0) return statusRankDiff;

    const overdueRankLeft = left.isOverdue ? 0 : left.isNearDeadline ? 1 : 2;
    const overdueRankRight = right.isOverdue ? 0 : right.isNearDeadline ? 1 : 2;
    if (overdueRankLeft !== overdueRankRight) return overdueRankLeft - overdueRankRight;

    const dayDiff = left.daysRemaining - right.daysRemaining;
    if (dayDiff !== 0) return dayDiff;

    const priorityDiff = PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

export async function listFinancialGoals(userId: string): Promise<FinancialGoalWithCategory[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("financial_goals")
    .select(
      "id, user_id, category_id, title, description, target_amount, current_amount, start_date, deadline, status, priority, created_at, updated_at, category:categories(id, name, type)",
    )
    .eq("user_id", userId)
    .order("deadline", { ascending: true });

  const goals = (data as RawFinancialGoal[] | null) ?? [];

  return goals.map((goal) => ({
    ...goal,
    target_amount: safeNumber(goal.target_amount),
    current_amount: safeNumber(goal.current_amount),
  }));
}

export async function getFinancialGoalsSnapshot(userId: string): Promise<FinancialGoalsSnapshot> {
  const goals = sortGoals((await listFinancialGoals(userId)).map(toGoalProgress));

  return {
    goals,
    summary: {
      totalGoals: goals.length,
      completedGoals: goals.filter((goal) => goal.status === "completed").length,
      plannedAmountTotal: goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
      currentAmountTotal: goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
      nearDeadlineCount: goals.filter((goal) => goal.isNearDeadline || goal.isOverdue).length,
      highPriorityCount: goals.filter((goal) => goal.priority === "high" && goal.status !== "completed").length,
    },
  };
}

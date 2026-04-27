import { getMonthDateRange, safeNumber } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listFinancialEntries } from "@/services/financial-entry-service";
import type { BudgetWithCategory } from "@/types/finance";

type RawBudgetRecord = {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  limit_amount: number;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
    type: "income" | "expense";
  } | null;
};

export async function listBudgets(userId: string, month?: number, year?: number): Promise<BudgetWithCategory[]> {
  const referenceDate = new Date();
  const resolvedMonth = month ?? referenceDate.getMonth() + 1;
  const resolvedYear = year ?? referenceDate.getFullYear();

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("budgets")
    .select("id, user_id, category_id, month, year, limit_amount, created_at, updated_at, category:categories(id, name, type)")
    .eq("user_id", userId)
    .eq("month", resolvedMonth)
    .eq("year", resolvedYear)
    .order("limit_amount", { ascending: false });

  const typedData = data as RawBudgetRecord[] | null;

  return (typedData ?? []).map((budget) => ({
    ...budget,
    limit_amount: safeNumber(budget.limit_amount),
  }));
}

export async function getBudgetProgress(userId: string, month: number, year: number) {
  const budgets = await listBudgets(userId, month, year);

  if (budgets.length === 0) {
    return [];
  }

  const range = getMonthDateRange(new Date(year, month - 1, 1));
  const spentByCategory = new Map<string, number>();
  const expenseEntries = await listFinancialEntries(userId, {
    type: "expense",
    from: range.start,
    to: range.end,
    sortBy: "transaction_date",
    sortOrder: "desc",
  });

  expenseEntries.forEach((entry) => {
    const current = spentByCategory.get(entry.category_id) ?? 0;
    spentByCategory.set(entry.category_id, current + safeNumber(entry.amount));
  });

  return budgets.map((budget) => {
    const spentAmount = spentByCategory.get(budget.category_id) ?? 0;
    const percentage = budget.limit_amount > 0 ? Math.round((spentAmount / budget.limit_amount) * 100) : 0;

    return {
      budgetId: budget.id,
      categoryId: budget.category_id,
      categoryName: budget.category?.name ?? "Categoria",
      limitAmount: budget.limit_amount,
      spentAmount,
      remainingAmount: budget.limit_amount - spentAmount,
      percentage,
      status: percentage >= 100 ? ("danger" as const) : percentage >= 80 ? ("warning" as const) : ("safe" as const),
    };
  });
}

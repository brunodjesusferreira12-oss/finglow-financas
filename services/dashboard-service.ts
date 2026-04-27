import { calculatePercentage, getMonthDateRange, getPreviousMonthDateRange } from "@/lib/utils";
import { getBudgetProgress } from "@/services/budget-service";
import { listCreditCardChargeEntries } from "@/services/credit-card-service";
import { getMonthlyFinancialEntries, listFinancialEntries } from "@/services/financial-entry-service";
import { getBalanceEntries } from "@/services/transaction-service";
import type { CategorySummaryItem, DashboardSnapshot } from "@/types/finance";

function sumByType(transactions: Array<{ amount: number; type: "income" | "expense" }>, type: "income" | "expense") {
  return transactions.filter((transaction) => transaction.type === type).reduce((acc, item) => acc + item.amount, 0);
}

function groupCategorySummary(
  transactions: Awaited<ReturnType<typeof getMonthlyFinancialEntries>>,
  totalExpense: number,
): CategorySummaryItem[] {
  const map = new Map<string, CategorySummaryItem>();

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const key = transaction.category_id;
      const current = map.get(key);
      const nextTotal = (current?.total ?? 0) + transaction.amount;

      map.set(key, {
        categoryId: key,
        categoryName: transaction.category?.name ?? "Sem categoria",
        total: nextTotal,
        type: "expense",
        percentage: totalExpense > 0 ? calculatePercentage(nextTotal, totalExpense) : 0,
      });
    });

  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 6);
}

function groupIncomeVsExpense(
  transactions: Awaited<ReturnType<typeof getMonthlyFinancialEntries>>,
): DashboardSnapshot["incomeVsExpense"] {
  const grouped = new Map<string, { label: string; income: number; expense: number }>();

  transactions.forEach((transaction) => {
    const date = transaction.transaction_date.slice(8, 10);
    const current = grouped.get(date) ?? { label: date, income: 0, expense: 0 };

    if (transaction.type === "income") {
      current.income += transaction.amount;
    } else {
      current.expense += transaction.amount;
    }

    grouped.set(date, current);
  });

  return [...grouped.values()].sort((a, b) => Number(a.label) - Number(b.label));
}

export async function getDashboardSnapshot(userId: string, userName?: string | null): Promise<DashboardSnapshot> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const previousRange = getPreviousMonthDateRange(now);
  const currentRange = getMonthDateRange(now);

  const [manualBalanceEntries, creditCardBalanceEntries, monthTransactions, previousTransactions, recentTransactions, budgetUsage] = await Promise.all([
    getBalanceEntries(userId),
    listCreditCardChargeEntries(userId, undefined, currentRange.end),
    getMonthlyFinancialEntries(userId, now),
    listFinancialEntries(
      userId,
      {
        from: previousRange.start,
        to: previousRange.end,
        sortBy: "transaction_date",
        sortOrder: "desc",
      },
      400,
    ),
    listFinancialEntries(
      userId,
      {
        sortBy: "transaction_date",
        sortOrder: "desc",
      },
      6,
    ),
    getBudgetProgress(userId, currentMonth, currentYear),
  ]);

  const balanceEntries = [...manualBalanceEntries, ...creditCardBalanceEntries];
  const balance = balanceEntries.reduce((acc, item) => acc + (item.type === "income" ? item.amount : -item.amount), 0);
  const incomeTotal = sumByType(monthTransactions, "income");
  const expenseTotal = sumByType(monthTransactions, "expense");
  const netTotal = incomeTotal - expenseTotal;
  const previousNetTotal =
    sumByType(previousTransactions, "income") - sumByType(previousTransactions, "expense");

  return {
    userName: userName?.trim() || "Usuário",
    balance,
    incomeTotal,
    expenseTotal,
    netTotal,
    previousNetTotal,
    savingsRate: currentRange.start && incomeTotal > 0 ? calculatePercentage(netTotal, incomeTotal) : 0,
    recentTransactions,
    incomeVsExpense: groupIncomeVsExpense(monthTransactions),
    categoryBreakdown: groupCategorySummary(monthTransactions, expenseTotal),
    budgetUsage,
  };
}

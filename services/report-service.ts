import { getMonthDateRange } from "@/lib/utils";
import { listFinancialEntries } from "@/services/financial-entry-service";
import type { FinancialEntry, ReportFilters } from "@/types/finance";

export function getDefaultReportFilters(referenceDate = new Date()): ReportFilters {
  const range = getMonthDateRange(referenceDate);
  return {
    from: range.start,
    to: range.end,
  };
}

export async function getReportSnapshot(userId: string, filters: ReportFilters) {
  const transactions = await listFinancialEntries(
    userId,
    {
      from: filters.from,
      to: filters.to,
      type: filters.type,
      categoryId: filters.categoryId,
      sortBy: "transaction_date",
      sortOrder: "desc",
    },
    500,
  );

  const totalIncome = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);

  const groupedCategories = new Map<
    string,
    {
      categoryName: string;
      total: number;
      type: "income" | "expense";
    }
  >();

  const groupedMonths = new Map<string, { label: string; income: number; expense: number }>();

  transactions.forEach((transaction) => {
    const categoryName = transaction.category?.name ?? "Sem categoria";
    const categoryTotal = groupedCategories.get(categoryName) ?? {
      categoryName,
      total: 0,
      type: transaction.type,
    };

    categoryTotal.total += transaction.amount;
    groupedCategories.set(categoryName, categoryTotal);

    const monthLabel = `${transaction.transaction_date.slice(5, 7)}/${transaction.transaction_date.slice(0, 4)}`;
    const monthly = groupedMonths.get(monthLabel) ?? {
      label: monthLabel,
      income: 0,
      expense: 0,
    };

    if (transaction.type === "income") {
      monthly.income += transaction.amount;
    } else {
      monthly.expense += transaction.amount;
    }

    groupedMonths.set(monthLabel, monthly);
  });

  return {
    filters,
    transactions,
    totalIncome,
    totalExpense,
    netTotal: totalIncome - totalExpense,
    categorySummary: [...groupedCategories.values()].sort((a, b) => b.total - a.total),
    monthlySeries: [...groupedMonths.values()],
  };
}

export function buildTransactionsCsv(
  transactions: FinancialEntry[],
) {
  const header = ["Data", "Tipo", "Categoria", "Descrição", "Origem", "Valor", "Observação"];
  const rows = transactions.map((transaction) => [
    transaction.transaction_date,
    transaction.type === "income" ? "Receita" : "Despesa",
    transaction.category?.name ?? "Sem categoria",
    transaction.description,
    transaction.source === "credit_card" ? transaction.sourceLabel ?? "Cartão de crédito" : "Transação manual",
    transaction.amount.toFixed(2).replace(".", ","),
    transaction.notes ?? "",
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";"))
    .join("\n");
}

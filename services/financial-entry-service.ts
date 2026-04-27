import { getMonthDateRange } from "@/lib/utils";
import { listCreditCardChargeEntries } from "@/services/credit-card-service";
import { listTransactions } from "@/services/transaction-service";
import type { FinancialEntry, TransactionFilters } from "@/types/finance";

function normalizeText(value?: string | null) {
  return (value ?? "").toLowerCase();
}

function sortFinancialEntries(entries: FinancialEntry[], filters: TransactionFilters) {
  const sortBy = filters.sortBy ?? "transaction_date";
  const sortOrder = filters.sortOrder ?? "desc";

  return [...entries].sort((left, right) => {
    const leftValue = sortBy === "amount" ? left.amount : left.transaction_date;
    const rightValue = sortBy === "amount" ? right.amount : right.transaction_date;

    if (leftValue === rightValue) {
      return right.created_at.localeCompare(left.created_at);
    }

    if (sortBy === "amount") {
      return sortOrder === "asc" ? left.amount - right.amount : right.amount - left.amount;
    }

    return sortOrder === "asc"
      ? left.transaction_date.localeCompare(right.transaction_date)
      : right.transaction_date.localeCompare(left.transaction_date);
  });
}

function filterFinancialEntries(entries: FinancialEntry[], filters: TransactionFilters) {
  return entries.filter((entry) => {
    if (filters.type && entry.type !== filters.type) return false;
    if (filters.categoryId && entry.category_id !== filters.categoryId) return false;
    if (filters.from && entry.transaction_date < filters.from) return false;
    if (filters.to && entry.transaction_date > filters.to) return false;

    if (filters.query) {
      const query = normalizeText(filters.query);
      const haystack = [entry.description, entry.notes, entry.category?.name, entry.sourceLabel]
        .map(normalizeText)
        .join(" ");

      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export async function listFinancialEntries(
  userId: string,
  filters: TransactionFilters = {},
  limit?: number,
): Promise<FinancialEntry[]> {
  const [transactions, creditCardCharges] = await Promise.all([
    listTransactions(userId, filters, limit ? Math.max(limit * 3, limit) : 1000),
    filters.type === "income" ? Promise.resolve([]) : listCreditCardChargeEntries(userId, filters.from, filters.to),
  ]);

  const manualEntries: FinancialEntry[] = transactions.map((transaction) => ({
    ...transaction,
    source: "transaction",
    sourceLabel: "Transação manual",
  }));

  const combined = sortFinancialEntries(filterFinancialEntries([...manualEntries, ...creditCardCharges], filters), filters);
  return limit ? combined.slice(0, limit) : combined;
}

export async function getMonthlyFinancialEntries(userId: string, referenceDate = new Date()) {
  const range = getMonthDateRange(referenceDate);

  return listFinancialEntries(
    userId,
    {
      from: range.start,
      to: range.end,
      sortBy: "transaction_date",
      sortOrder: "desc",
    },
    400,
  );
}

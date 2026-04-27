import { getMonthDateRange, safeNumber } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TransactionFilters, TransactionType, TransactionWithCategory } from "@/types/finance";

type RawTransactionRecord = {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
    type: TransactionType;
  } | null;
};

export function mapTransactionRecord(record: RawTransactionRecord): TransactionWithCategory {
  return {
    id: record.id,
    user_id: record.user_id,
    category_id: record.category_id,
    description: record.description,
    amount: safeNumber(record.amount),
    type: record.type,
    transaction_date: record.transaction_date,
    notes: record.notes,
    created_at: record.created_at,
    updated_at: record.updated_at,
    category: record.category,
  };
}

export async function listTransactions(
  userId: string,
  filters: TransactionFilters = {},
  limit?: number,
): Promise<TransactionWithCategory[]> {
  const supabase = await createServerSupabaseClient();
  const sortBy = filters.sortBy ?? "transaction_date";
  const sortOrder = filters.sortOrder ?? "desc";

  let query = supabase
    .from("transactions")
    .select(
      "id, user_id, category_id, description, amount, type, transaction_date, notes, created_at, updated_at, category:categories(id, name, type)",
    )
    .eq("user_id", userId)
    .order(sortBy, { ascending: sortOrder === "asc" });

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.from) {
    query = query.gte("transaction_date", filters.from);
  }

  if (filters.to) {
    query = query.lte("transaction_date", filters.to);
  }

  if (filters.query) {
    const sanitized = filters.query.replace(/,/g, " ");
    query = query.or(`description.ilike.%${sanitized}%,notes.ilike.%${sanitized}%`);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data } = await query;
  const typedData = data as RawTransactionRecord[] | null;
  return (typedData ?? []).map(mapTransactionRecord);
}

export async function getMonthlyTransactions(userId: string, referenceDate = new Date()) {
  const range = getMonthDateRange(referenceDate);

  return listTransactions(
    userId,
    {
      from: range.start,
      to: range.end,
      sortBy: "transaction_date",
      sortOrder: "desc",
    },
    200,
  );
}

export async function getBalanceEntries(userId: string): Promise<Array<{ amount: number; type: TransactionType }>> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("transactions").select("amount, type").eq("user_id", userId);
  const typedData = data as Array<{ amount: number; type: TransactionType }> | null;

  return (typedData ?? []).map((item) => ({
    amount: safeNumber(item.amount),
    type: item.type,
  }));
}

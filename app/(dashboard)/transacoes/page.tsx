import { Wallet } from "lucide-react";

import { SectionHeading } from "@/components/ui/section-heading";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionsFilterBar } from "@/components/transactions/transactions-filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineNotice } from "@/components/ui/inline-notice";
import { requireUser } from "@/lib/auth";
import { getSingleParam } from "@/lib/utils";
import { getCategories } from "@/services/category-service";
import { listTransactions } from "@/services/transaction-service";
import type { Category, TransactionFilters, TransactionWithCategory } from "@/types/finance";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseFilters(params: Record<string, string | string[] | undefined>): TransactionFilters {
  const sort = getSingleParam(params.sort) ?? "transaction_date:desc";
  const [sortByRaw, sortOrderRaw] = sort.split(":");
  const type = getSingleParam(params.type);

  return {
    query: getSingleParam(params.query) || undefined,
    type: type === "income" || type === "expense" ? type : undefined,
    categoryId: getSingleParam(params.categoryId) || undefined,
    from: getSingleParam(params.from) || undefined,
    to: getSingleParam(params.to) || undefined,
    sortBy: sortByRaw === "amount" ? "amount" : "transaction_date",
    sortOrder: sortOrderRaw === "asc" ? "asc" : "desc",
  };
}

export default async function TransactionsPage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const filters = parseFilters(params);
  const editId = getSingleParam(params.edit);
  let categories: Category[] = [];
  let categoriesError: string | null = null;
  const transactionsResult = await listTransactions(user.id, filters, 300);

  try {
    categories = (await getCategories(user.id)) as Category[];
  } catch (error) {
    categoriesError = error instanceof Error ? error.message : "Não foi possível carregar as categorias agora.";
  }

  const transactions = transactionsResult as TransactionWithCategory[];

  const editingTransaction = transactions.find((transaction) => transaction.id === editId) ?? null;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Transações"
        description="Cadastre entradas e saídas, filtre por período, categoria e tipo, e acompanhe a evolução do caixa."
      />

      {categoriesError ? (
        <InlineNotice
          tone="warning"
          title="Categorias indisponíveis no momento"
          description={categoriesError}
        />
      ) : null}

      <TransactionsFilterBar categories={categories} filters={filters} />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TransactionForm categories={categories} initialData={editingTransaction} />
        {transactions.length > 0 ? (
          <TransactionTable transactions={transactions} />
        ) : (
          <EmptyState
            icon={Wallet}
            title="Nenhuma transação encontrada"
            description="Ajuste os filtros ou cadastre uma nova movimentação para ver os dados aqui."
          />
        )}
      </div>
    </div>
  );
}

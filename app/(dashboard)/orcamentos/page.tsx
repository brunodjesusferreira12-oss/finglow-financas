import { PiggyBank } from "lucide-react";

import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetList } from "@/components/budgets/budget-list";
import { BudgetPeriodFilter } from "@/components/budgets/budget-period-filter";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireUser } from "@/lib/auth";
import { MONTH_NAMES } from "@/lib/constants";
import { getSingleParam } from "@/lib/utils";
import { getCategories } from "@/services/category-service";
import { getBudgetProgress, listBudgets } from "@/services/budget-service";
import type { BudgetWithCategory, Category } from "@/types/finance";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BudgetsPage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const now = new Date();
  const month = Number(getSingleParam(params.month) ?? now.getMonth() + 1);
  const year = Number(getSingleParam(params.year) ?? now.getFullYear());
  const editId = getSingleParam(params.edit);

  let expenseCategories: Category[] = [];
  let categoriesError: string | null = null;
  const [budgetsResult, budgetProgress] = await Promise.all([listBudgets(user.id, month, year), getBudgetProgress(user.id, month, year)]);

  try {
    expenseCategories = (await getCategories(user.id, "expense")) as Category[];
  } catch (error) {
    categoriesError = error instanceof Error ? error.message : "Não foi possível carregar as categorias de despesa.";
  }

  const budgets = budgetsResult as BudgetWithCategory[];
  const editingBudget = budgets.find((budget) => budget.id === editId) ?? null;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Orçamentos"
        description={`Defina limites por categoria para ${MONTH_NAMES[month - 1]} de ${year} e acompanhe alertas visuais antes de estourar o caixa.`}
      />

      {categoriesError ? (
        <InlineNotice
          tone="warning"
          title="Categorias de despesa indisponíveis"
          description={categoriesError}
        />
      ) : null}

      <BudgetPeriodFilter month={month} year={year} />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <BudgetForm initialData={editingBudget} categories={expenseCategories} month={month} year={year} />
        {budgetProgress.length > 0 ? (
          <BudgetList items={budgetProgress} month={month} year={year} />
        ) : (
          <EmptyState
            icon={PiggyBank}
            title="Nenhum orçamento configurado"
            description="Escolha uma categoria de despesa e defina o limite mensal para começar a receber alertas visuais."
          />
        )}
      </div>
    </div>
  );
}

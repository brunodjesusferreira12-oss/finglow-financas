import { CheckCircle2, Clock3, PiggyBank, Target } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { FinancialGoalForm } from "@/components/goals/financial-goal-form";
import { FinancialGoalList } from "@/components/goals/financial-goal-list";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { getSingleParam } from "@/lib/utils";
import { getCategories } from "@/services/category-service";
import { getFinancialGoalsSnapshot } from "@/services/financial-goal-service";
import type { Category } from "@/types/finance";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FinancialGoalsPage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const editGoalId = getSingleParam(params.edit);

  let categories: Category[] = [];
  let categoriesError: string | null = null;
  const snapshot = await getFinancialGoalsSnapshot(user.id);

  try {
    categories = (await getCategories(user.id)) as Category[];
  } catch (error) {
    categoriesError = error instanceof Error ? error.message : "Não foi possível carregar as categorias para relacionar com metas.";
  }

  const editingGoal = snapshot.goals.find((goal) => goal.id === editGoalId) ?? null;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Metas e Objetivos"
        description="Transforme planos financeiros em metas acompanháveis com prazo, prioridade, progresso e aportes registrados ao longo do tempo."
      />

      {categoriesError ? (
        <InlineNotice
          tone="warning"
          title="Categorias indisponíveis"
          description={categoriesError}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total de metas"
          value={String(snapshot.summary.totalGoals)}
          description="Objetivos financeiros cadastrados na sua conta"
          icon={Target}
          tone="neutral"
        />
        <KpiCard
          label="Metas concluídas"
          value={String(snapshot.summary.completedGoals)}
          description="Objetivos já marcados como concluídos"
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Valor planejado"
          value={formatCurrency(snapshot.summary.plannedAmountTotal)}
          description="Soma do valor-alvo de todas as metas"
          icon={PiggyBank}
          tone="neutral"
        />
        <KpiCard
          label="Prazos sensíveis"
          value={String(snapshot.summary.nearDeadlineCount)}
          description="Metas com prazo curto ou já vencido"
          icon={Clock3}
          tone={snapshot.summary.nearDeadlineCount > 0 ? "danger" : "neutral"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <FinancialGoalForm categories={categories} initialData={editingGoal} />
        {snapshot.goals.length > 0 ? (
          <FinancialGoalList goals={snapshot.goals} nearDeadlineCount={snapshot.summary.nearDeadlineCount} />
        ) : (
          <EmptyState
            icon={Target}
            title="Nenhuma meta cadastrada"
            description="Crie sua primeira meta para acompanhar progresso, aportes e prazo de realização."
          />
        )}
      </div>
    </div>
  );
}

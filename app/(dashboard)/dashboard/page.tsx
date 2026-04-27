import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

import { BudgetProgressList } from "@/components/dashboard/budget-progress-list";
import { CategoryBreakdownChart } from "@/components/dashboard/category-breakdown-chart";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/services/profile-service";
import { getDashboardSnapshot } from "@/services/dashboard-service";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const snapshot = await getDashboardSnapshot(user.id, profile?.full_name || user.email);
  const delta = snapshot.netTotal - snapshot.previousNetTotal;

  return (
    <div className="space-y-8">
      <section className="glass-panel overflow-hidden p-8">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Visão geral do mês
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-balance lg:text-4xl">
                Olá, {snapshot.userName}. Seu saldo atual está em {formatCurrency(snapshot.balance)}.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Use este painel para acompanhar o resultado líquido do mês, identificar categorias que mais pesam no orçamento e agir cedo antes de ultrapassar seus limites.
              </p>
            </div>
          </div>

          <div className="metric-gradient rounded-[28px] border border-border/70 p-6">
            <p className="text-sm font-medium text-muted-foreground">Resumo rapido</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-card/80 p-4">
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="mt-2 text-2xl font-semibold text-success">{formatCompactCurrency(snapshot.incomeTotal)}</p>
              </div>
              <div className="rounded-3xl bg-card/80 p-4">
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="mt-2 text-2xl font-semibold text-danger">{formatCompactCurrency(snapshot.expenseTotal)}</p>
              </div>
              <div className="rounded-3xl bg-card/80 p-4 sm:col-span-2">
                <p className="text-sm text-muted-foreground">Taxa de poupança</p>
                <p className="mt-2 text-2xl font-semibold">{snapshot.savingsRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Saldo atual" value={formatCurrency(snapshot.balance)} description="Saldo acumulado da conta" icon={Wallet} tone="neutral" />
        <KpiCard label="Receitas do mês" value={formatCurrency(snapshot.incomeTotal)} description="Entradas registradas no período atual" icon={ArrowUpRight} tone="success" />
        <KpiCard label="Despesas do mês" value={formatCurrency(snapshot.expenseTotal)} description="Saídas registradas no período atual" icon={ArrowDownRight} tone="danger" />
        <KpiCard
          label="Resultado líquido"
          value={formatCurrency(snapshot.netTotal)}
          description={`${delta >= 0 ? "Subiu" : "Caiu"} ${formatCurrency(Math.abs(delta))} em relação ao mês anterior`}
          icon={snapshot.netTotal >= 0 ? ArrowUpRight : ArrowDownRight}
          tone={snapshot.netTotal >= 0 ? "success" : "danger"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <IncomeExpenseChart data={snapshot.incomeVsExpense} />
        <CategoryBreakdownChart data={snapshot.categoryBreakdown} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <BudgetProgressList items={snapshot.budgetUsage} />
        <RecentTransactions transactions={snapshot.recentTransactions} />
      </section>

      {snapshot.recentTransactions.length === 0 ? (
        <section>
          <SectionHeading
            title="Comece registrando suas movimentações"
            description="Assim que você cadastrar receitas e despesas, o painel passa a calcular indicadores, gráficos e alertas automaticamente."
          />
          <div className="mt-4">
            <EmptyState
              icon={Wallet}
              title="Nenhuma transação encontrada"
              description="Cadastre sua primeira receita ou despesa na aba de transações para alimentar o dashboard."
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

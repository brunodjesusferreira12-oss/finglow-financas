import { ChartColumnIncreasing } from "lucide-react";

import { CategoryBreakdownChart } from "@/components/dashboard/category-breakdown-chart";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ReportCategoryTable } from "@/components/reports/report-category-table";
import { ReportFiltersBar } from "@/components/reports/report-filters";
import { ReportTransactionsTable } from "@/components/reports/report-transactions-table";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { getSingleParam } from "@/lib/utils";
import { getCategories } from "@/services/category-service";
import { getDefaultReportFilters, getReportSnapshot } from "@/services/report-service";
import type { Category, ReportFilters } from "@/types/finance";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function resolveFilters(params: Record<string, string | string[] | undefined>): ReportFilters {
  const defaults = getDefaultReportFilters();
  const type = getSingleParam(params.type);

  return {
    from: getSingleParam(params.from) ?? defaults.from,
    to: getSingleParam(params.to) ?? defaults.to,
    type: type === "income" || type === "expense" ? type : undefined,
    categoryId: getSingleParam(params.categoryId) || undefined,
  };
}

export default async function ReportsPage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const filters = resolveFilters(params);
  let categories: Category[] = [];
  let categoriesError: string | null = null;
  const report = await getReportSnapshot(user.id, filters);

  try {
    categories = (await getCategories(user.id)) as Category[];
  } catch (error) {
    categoriesError = error instanceof Error ? error.message : "Não foi possível carregar as categorias do filtro.";
  }

  const chartData = report.categorySummary
    .filter((item) => item.type === "expense")
    .slice(0, 6)
    .map((item) => ({
      categoryId: item.categoryName,
      categoryName: item.categoryName,
      total: item.total,
      percentage: report.totalExpense > 0 ? Math.round((item.total / report.totalExpense) * 100) : 0,
    }));

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Relatórios"
        description="Filtre por período e categoria, compare receitas com despesas e exporte tudo em CSV para análises externas."
      />

      {categoriesError ? (
        <InlineNotice
          tone="warning"
          title="Categorias do filtro indisponíveis"
          description={categoriesError}
        />
      ) : null}

      <ReportFiltersBar categories={categories} filters={filters} />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Receitas" value={formatCurrency(report.totalIncome)} description="Total das entradas no período filtrado" tone="success" />
        <KpiCard label="Despesas" value={formatCurrency(report.totalExpense)} description="Total das saídas no período filtrado" tone="danger" />
        <KpiCard label="Resultado" value={formatCurrency(report.netTotal)} description="Saldo líquido do período selecionado" tone={report.netTotal >= 0 ? "success" : "danger"} />
      </section>

      {report.transactions.length > 0 ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <IncomeExpenseChart data={report.monthlySeries} title="Receitas x despesas no período" description="Comparativo consolidado do filtro atual." />
            <CategoryBreakdownChart data={chartData} title="Participação por categoria" description="Categorias de despesa com maior peso no período." />
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <ReportCategoryTable items={report.categorySummary} />
            <ReportTransactionsTable transactions={report.transactions} />
          </section>
        </>
      ) : (
        <EmptyState
          icon={ChartColumnIncreasing}
          title="Nenhum dado para o filtro atual"
          description="Escolha outro período ou cadastre movimentações para gerar relatórios e exportar em CSV."
        />
      )}
    </div>
  );
}

import { Download } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buildQueryString } from "@/lib/utils";
import type { Category, ReportFilters } from "@/types/finance";

export function ReportFiltersBar({
  categories,
  filters,
}: {
  categories: Category[];
  filters: ReportFilters;
}) {
  const exportHref = `/api/reports/export${buildQueryString({
    from: filters.from,
    to: filters.to,
    type: filters.type,
    categoryId: filters.categoryId,
  })}`;

  return (
    <Card>
      <CardContent className="p-6">
        <form className="grid gap-4 lg:grid-cols-5" action="/relatorios">
          <div>
            <label className="mb-2 block text-sm font-medium">De</label>
            <Input type="date" name="from" defaultValue={filters.from} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Ate</label>
            <Input type="date" name="to" defaultValue={filters.to} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Tipo</label>
            <Select name="type" defaultValue={filters.type ?? ""}>
              <option value="">Todos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Categoria</label>
            <Select name="categoryId" defaultValue={filters.categoryId ?? ""}>
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-end gap-3">
            <Button type="submit" className="w-full">
              Aplicar
            </Button>
            <Link href={exportHref} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background transition hover:bg-secondary" aria-label="Exportar CSV">
              <Download className="h-4 w-4" />
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

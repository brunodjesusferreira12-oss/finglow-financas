import { Filter, Search, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Category, TransactionFilters } from "@/types/finance";

export function TransactionsFilterBar({
  categories,
  filters,
}: {
  categories: Category[];
  filters: TransactionFilters;
}) {
  const sortValue = `${filters.sortBy ?? "transaction_date"}:${filters.sortOrder ?? "desc"}`;

  return (
    <Card>
      <CardContent className="p-6">
        <form className="grid gap-4 lg:grid-cols-6" action="/transacoes">
          <div className="lg:col-span-2">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4" />
              Buscar
            </label>
          <Input name="query" placeholder="Descrição ou observação" defaultValue={filters.query} />
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

          <div>
            <label className="mb-2 block text-sm font-medium">De</label>
            <Input type="date" name="from" defaultValue={filters.from} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Ate</label>
            <Input type="date" name="to" defaultValue={filters.to} />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Ordenar
            </label>
            <Select name="sort" defaultValue={sortValue}>
              <option value="transaction_date:desc">Mais recentes</option>
              <option value="transaction_date:asc">Mais antigas</option>
              <option value="amount:desc">Maior valor</option>
              <option value="amount:asc">Menor valor</option>
            </Select>
          </div>

          <div className="flex items-end gap-3 lg:col-span-6">
            <Button type="submit">Aplicar filtros</Button>
            <Link href="/transacoes" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
              <X className="h-4 w-4" />
              Limpar filtros
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

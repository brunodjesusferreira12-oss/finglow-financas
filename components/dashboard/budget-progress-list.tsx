import { AlertTriangle, CircleDollarSign } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export function BudgetProgressList({
  items,
}: {
  items: Array<{
    budgetId: string;
    categoryId: string;
    categoryName: string;
    limitAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentage: number;
    status: "safe" | "warning" | "danger";
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamentos do mês</CardTitle>
        <CardDescription>Receba alertas visuais quando estiver perto do limite ou quando ultrapassar o valor planejado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.budgetId} className="space-y-3 rounded-3xl border border-border/70 bg-secondary/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-sm">
                    {item.status === "danger" ? <AlertTriangle className="h-5 w-5 text-danger" /> : <CircleDollarSign className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium">{item.categoryName}</p>
                    <p className="text-sm text-muted-foreground">
                      Gasto {formatCurrency(item.spentAmount)} de {formatCurrency(item.limitAmount)}
                    </p>
                  </div>
                </div>
                <Badge tone={item.status === "danger" ? "danger" : item.status === "warning" ? "warning" : "success"}>
                  {item.status === "danger" ? "Acima do limite" : item.status === "warning" ? "Perto do limite" : "Saudavel"}
                </Badge>
              </div>
              <ProgressBar value={item.percentage} tone={item.status} />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{item.percentage}% consumido</span>
                <span>{formatCurrency(item.remainingAmount)} restante</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/30 px-4 py-12 text-center text-sm text-muted-foreground">
              Nenhum orçamento definido para este mês.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

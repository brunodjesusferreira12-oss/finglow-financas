"use client";

import Link from "next/link";
import { PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteBudgetAction } from "@/app/actions/budgets";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useNotifications } from "@/hooks/use-notifications";
import { formatCurrency } from "@/lib/format";
import { MONTH_NAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function DeleteBudgetButton({ budgetId }: { budgetId: string }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Deseja excluir este orçamento?")) return;

        startTransition(async () => {
          const result = await deleteBudgetAction(budgetId);
          notify({ variant: result.success ? "success" : "error", message: result.message });
          router.refresh();
        });
      }}
      aria-label="Excluir orçamento"
    >
      <Trash2 className="h-4 w-4 text-danger" />
    </Button>
  );
}

export function BudgetList({
  items,
  month,
  year,
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
  month: number;
  year: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoramento dos orçamentos</CardTitle>
        <CardDescription>
          Acompanhamento de {MONTH_NAMES[month - 1]} de {year} com alertas por categoria.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.budgetId} className="space-y-4 rounded-3xl border border-border/70 bg-secondary/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">{item.categoryName}</p>
                <p className="text-sm text-muted-foreground">
                  Gasto {formatCurrency(item.spentAmount)} de {formatCurrency(item.limitAmount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={item.status === "danger" ? "danger" : item.status === "warning" ? "warning" : "success"}>
                  {item.status === "danger" ? "Acima do limite" : item.status === "warning" ? "Atencao" : "Dentro do plano"}
                </Badge>
                <Link href={`/orcamentos?month=${month}&year=${year}&edit=${item.budgetId}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                  <PencilLine className="h-4 w-4" />
                </Link>
                <DeleteBudgetButton budgetId={item.budgetId} />
              </div>
            </div>

            <ProgressBar value={item.percentage} tone={item.status} />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{item.percentage}% consumido</span>
              <span>Restante: {formatCurrency(item.remainingAmount)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

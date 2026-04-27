import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { FinancialEntry } from "@/types/finance";

export function RecentTransactions({ transactions }: { transactions: FinancialEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas transações</CardTitle>
        <CardDescription>As movimentações mais recentes ajudam você a identificar padrões rapidamente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-4 rounded-3xl border border-border/70 bg-secondary/20 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    transaction.type === "income" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                  }`}
                >
                  {transaction.type === "income" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{transaction.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{transaction.category?.name ?? "Sem categoria"}</span>
                    <span>-</span>
                    <span>{formatDate(transaction.transaction_date)}</span>
                    {transaction.sourceLabel ? (
                      <>
                        <span>-</span>
                        <span>{transaction.sourceLabel}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${transaction.type === "income" ? "text-success" : "text-danger"}`}>
                  {transaction.type === "income" ? "+" : "-"} {formatCurrency(transaction.amount)}
                </p>
                <Badge tone={transaction.type === "income" ? "success" : "danger"}>
                  {transaction.type === "income" ? "Receita" : "Despesa"}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/30 px-4 py-12 text-center text-sm text-muted-foreground">
            Suas últimas movimentações vão aparecer aqui assim que você registrar a primeira transação.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

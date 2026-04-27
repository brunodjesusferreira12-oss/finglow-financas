import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { FinancialEntry } from "@/types/finance";

export function ReportTransactionsTable({ transactions }: { transactions: FinancialEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações do relatório</CardTitle>
        <CardDescription>Lista detalhada para conferencia antes da exportacao.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.slice(0, 12).map((transaction) => (
          <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/70 bg-secondary/20 px-4 py-4">
            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.category?.name ?? "Sem categoria"} • {formatDate(transaction.transaction_date)}
                {transaction.sourceLabel ? ` • ${transaction.sourceLabel}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={transaction.type === "income" ? "success" : "danger"}>
                {transaction.type === "income" ? "Receita" : "Despesa"}
              </Badge>
              <p className={`font-semibold ${transaction.type === "income" ? "text-success" : "text-danger"}`}>
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

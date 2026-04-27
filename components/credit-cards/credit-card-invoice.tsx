import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CreditCardMonthlyCharge, CreditCardSnapshot } from "@/types/finance";

function ChargeRow({ charge }: { charge: CreditCardMonthlyCharge }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/70 bg-secondary/20 p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: charge.cardColor }} />
          <p className="font-medium">{charge.description}</p>
          <Badge tone={charge.isFixed ? "warning" : "neutral"}>
            {charge.isFixed ? "Fixa" : `${charge.installmentNumber}/${charge.installmentsCount}`}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {charge.cardName}
          {charge.cardLastFour ? ` final ${charge.cardLastFour}` : ""} • {charge.categoryName} • compra em{" "}
          {formatDate(charge.purchaseDate)}
        </p>
      </div>
      <p className="text-lg font-semibold text-danger">{formatCurrency(charge.amount)}</p>
    </div>
  );
}

export function CreditCardInvoice({ snapshot }: { snapshot: CreditCardSnapshot }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fatura calculada</CardTitle>
        <CardDescription>Parcelas e compras fixas previstas para o mês selecionado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          {snapshot.totalsByCard.map((item) => (
            <div key={item.cardId} className="space-y-3 rounded-3xl border border-border/70 bg-secondary/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.cardName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.cardLastFour ? `Final ${item.cardLastFour} • ` : ""}Limite {formatCurrency(item.limitAmount)}
                  </p>
                </div>
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: item.cardColor }} />
              </div>
              <ProgressBar value={item.usagePercentage} tone={item.usagePercentage >= 100 ? "danger" : item.usagePercentage >= 80 ? "warning" : "safe"} />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{item.usagePercentage}% do limite</span>
                <span>{formatCurrency(item.totalDue)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {snapshot.charges.length > 0 ? (
            snapshot.charges.map((charge) => <ChargeRow key={`${charge.purchaseId}-${charge.installmentNumber ?? "fixed"}`} charge={charge} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-secondary/30 px-4 py-12 text-center text-sm text-muted-foreground">
              Nenhuma parcela ou compra fixa prevista para este mês.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export function ReportCategoryTable({
  items,
}: {
  items: Array<{
    categoryName: string;
    total: number;
    type: "income" | "expense";
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo por categoria</CardTitle>
        <CardDescription>Veja quanto cada grupo representa dentro do filtro aplicado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={`${item.categoryName}-${item.type}`} className="flex items-center justify-between gap-4 rounded-3xl border border-border/70 bg-secondary/20 px-4 py-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{item.categoryName}</p>
              <Badge tone={item.type === "income" ? "success" : "danger"}>
                {item.type === "income" ? "Receita" : "Despesa"}
              </Badge>
            </div>
            <p className={`font-semibold ${item.type === "income" ? "text-success" : "text-danger"}`}>
              {formatCurrency(item.total)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

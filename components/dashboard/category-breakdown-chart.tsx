"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const COLORS = ["#0f766e", "#0ea5e9", "#1d4ed8", "#f97316", "#dc2626", "#7c3aed"];

export function CategoryBreakdownChart({
  data,
  title = "Despesas por categoria",
  description = "Entenda quais categorias concentram a maior parte dos gastos.",
}: {
  data: Array<{ categoryId: string; categoryName: string; total: number; percentage: number }>;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {data.length > 0 ? (
          <>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="total" nameKey="categoryName" innerRadius={68} outerRadius={104} paddingAngle={4}>
                    {data.map((entry, index) => (
                      <Cell key={entry.categoryId} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={item.categoryId} className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div>
                      <p className="font-medium">{item.categoryName}</p>
                      <p className="text-sm text-muted-foreground">{item.percentage}% do total</p>
                    </div>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="col-span-full flex h-[280px] items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
            Sem categorias suficientes para montar o grafico.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

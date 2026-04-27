"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export function IncomeExpenseChart({
  data,
  title = "Receitas x despesas",
  description = "Acompanhe a variação de entradas e saídas ao longo do período.",
}: {
  data: Array<{ label: string; income: number; expense: number }>;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        {data.length > 0 ? (
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0.06} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} tick={{ fontSize: 12 }} />
                <YAxis
                  width={72}
                  tickFormatter={(value) => formatCurrency(value).replace("R$", "").trim()}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="income" stroke="#0f766e" strokeWidth={2.5} fill="url(#incomeFill)" />
                <Area type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2.5} fill="url(#expenseFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
            Sem dados suficientes para gerar o gráfico neste recorte.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

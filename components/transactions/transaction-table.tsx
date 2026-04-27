"use client";

import Link from "next/link";
import { PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteTransactionAction } from "@/app/actions/transactions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/hooks/use-notifications";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransactionWithCategory } from "@/types/finance";

function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Tem certeza que deseja excluir esta transação?")) return;

        startTransition(async () => {
          const result = await deleteTransactionAction(transactionId);
          notify({ variant: result.success ? "success" : "error", message: result.message });
          router.refresh();
        });
      }}
      aria-label="Excluir transação"
    >
      <Trash2 className="h-4 w-4 text-danger" />
    </Button>
  );
}

export function TransactionTable({ transactions }: { transactions: TransactionWithCategory[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de transações</CardTitle>
        <CardDescription>Edite ou exclua movimentações com confirmação antes da remoção.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground">
              <th className="pb-3 font-medium">Descrição</th>
                <th className="pb-3 font-medium">Categoria</th>
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Valor</th>
                <th className="pb-3 text-right font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-border/50">
                  <td className="py-4">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      {transaction.notes ? <p className="mt-1 text-xs text-muted-foreground">{transaction.notes}</p> : null}
                    </div>
                  </td>
                  <td className="py-4">{transaction.category?.name ?? "Sem categoria"}</td>
                  <td className="py-4">{formatDate(transaction.transaction_date)}</td>
                  <td className="py-4">
                    <Badge tone={transaction.type === "income" ? "success" : "danger"}>
                      {transaction.type === "income" ? "Receita" : "Despesa"}
                    </Badge>
                  </td>
                  <td className={`py-4 font-semibold ${transaction.type === "income" ? "text-success" : "text-danger"}`}>
                    {transaction.type === "income" ? "+" : "-"} {formatCurrency(transaction.amount)}
                  </td>
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/transacoes?edit=${transaction.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                        <PencilLine className="h-4 w-4" />
                      </Link>
                      <DeleteTransactionButton transactionId={transaction.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 lg:hidden">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="rounded-3xl border border-border/70 bg-secondary/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {transaction.category?.name ?? "Sem categoria"} • {formatDate(transaction.transaction_date)}
                  </p>
                </div>
                <Badge tone={transaction.type === "income" ? "success" : "danger"}>
                  {transaction.type === "income" ? "Receita" : "Despesa"}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className={`font-semibold ${transaction.type === "income" ? "text-success" : "text-danger"}`}>
                  {transaction.type === "income" ? "+" : "-"} {formatCurrency(transaction.amount)}
                </p>
                <div className="flex gap-2">
                  <Link href={`/transacoes?edit=${transaction.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                    <PencilLine className="h-4 w-4" />
                  </Link>
                  <DeleteTransactionButton transactionId={transaction.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

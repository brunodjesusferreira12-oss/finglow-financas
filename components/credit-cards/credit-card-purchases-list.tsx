"use client";

import Link from "next/link";
import { PencilLine, Repeat2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteCreditCardPurchaseAction } from "@/app/actions/credit-cards";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useNotifications } from "@/hooks/use-notifications";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CreditCardPurchaseWithRelations } from "@/types/finance";

function getInstallmentProgress(purchase: CreditCardPurchaseWithRelations, month: number, year: number) {
  if (purchase.is_fixed) return 100;

  const purchaseDate = new Date(`${purchase.purchase_date}T00:00:00`);
  const diff = (year - purchaseDate.getFullYear()) * 12 + (month - (purchaseDate.getMonth() + 1));
  const paidInstallments = Math.max(0, Math.min(purchase.installments_count, diff + 1));

  return Math.round((paidInstallments / purchase.installments_count) * 100);
}

function DeletePurchaseButton({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Deseja excluir esta compra do cartão?")) return;

        startTransition(async () => {
          const result = await deleteCreditCardPurchaseAction(purchaseId);
          notify({ variant: result.success ? "success" : "error", message: result.message });
          router.refresh();
        });
      }}
      aria-label="Excluir compra"
    >
      <Trash2 className="h-4 w-4 text-danger" />
    </Button>
  );
}

export function CreditCardPurchasesList({
  purchases,
  month,
  year,
}: {
  purchases: CreditCardPurchaseWithRelations[];
  month: number;
  year: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compras cadastradas</CardTitle>
        <CardDescription>Edite parcelas, compras fixas e acompanhe o andamento ate a finalizacao.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {purchases.length > 0 ? (
          purchases.map((purchase) => {
            const progress = getInstallmentProgress(purchase, month, year);

            return (
              <div key={purchase.id} className="space-y-4 rounded-3xl border border-border/70 bg-secondary/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{purchase.description}</p>
                      <Badge tone={purchase.is_fixed ? "warning" : progress >= 100 ? "success" : "neutral"}>
                        {purchase.is_fixed ? "Fixa mensal" : `${purchase.installments_count}x`}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                    {purchase.card?.name ?? "Cartão"} • {purchase.category?.name ?? "Categoria"} • {formatDate(purchase.purchase_date)}
                    </p>
                    <p className="mt-2 text-sm font-medium">{formatCurrency(purchase.amount_total)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {purchase.is_fixed ? <Repeat2 className="h-4 w-4 text-warning" /> : null}
                    <Link href={`/cartoes?editPurchase=${purchase.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                      <PencilLine className="h-4 w-4" />
                    </Link>
                    <DeletePurchaseButton purchaseId={purchase.id} />
                  </div>
                </div>

                {!purchase.is_fixed ? (
                  <>
                    <ProgressBar value={progress} tone={progress >= 100 ? "safe" : progress >= 80 ? "warning" : "safe"} />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{progress}% concluido</span>
                      <span>
                        {Math.round((progress / 100) * purchase.installments_count)} de {purchase.installments_count} parcelas
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="rounded-2xl bg-warning/15 px-4 py-3 text-sm text-muted-foreground">
                    Compra fixa: aparece todo mes na fatura ate ser editada ou excluida.
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/30 px-4 py-12 text-center text-sm text-muted-foreground">
              Nenhuma compra cadastrada em cartões ainda.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

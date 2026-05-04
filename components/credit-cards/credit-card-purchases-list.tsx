"use client";

import Link from "next/link";
import { PencilLine, Repeat2, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState, useTransition } from "react";

import { deleteCreditCardPurchaseAction } from "@/app/actions/credit-cards";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getPaidInstallmentsCount } from "@/lib/credit-card";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import type { CreditCardPurchaseWithRelations } from "@/types/finance";

function normalizeSearchTerm(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function matchesPurchaseSearch(purchase: CreditCardPurchaseWithRelations, query: string) {
  if (!query) return true;

  const searchableContent = [
    purchase.description,
    purchase.card?.name,
    purchase.card?.last_four,
    purchase.category?.name,
    purchase.notes,
    purchase.purchase_date,
    String(purchase.installments_count),
    formatCurrency(purchase.amount_total),
    formatDate(purchase.purchase_date),
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeSearchTerm(searchableContent).includes(query);
}

function getInstallmentProgress(purchase: CreditCardPurchaseWithRelations, month: number, year: number) {
  if (purchase.is_fixed) {
    return {
      percentage: 100,
      paidInstallments: 1,
    };
  }

  const paidInstallments = getPaidInstallmentsCount(
    purchase.purchase_date,
    purchase.card?.closing_day,
    purchase.installments_count,
    month,
    year,
  );

  return {
    percentage: Math.round((paidInstallments / purchase.installments_count) * 100),
    paidInstallments,
  };
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
        if (!window.confirm("Deseja excluir esta compra do cartao?")) return;

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

function PurchaseCard({
  purchase,
  month,
  year,
}: {
  purchase: CreditCardPurchaseWithRelations;
  month: number;
  year: number;
}) {
  const progress = getInstallmentProgress(purchase, month, year);

  return (
    <div className="space-y-4 rounded-3xl border border-border/70 bg-secondary/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{purchase.description}</p>
            <Badge tone={purchase.is_fixed ? "warning" : progress.percentage >= 100 ? "success" : "neutral"}>
              {purchase.is_fixed ? "Fixa mensal" : `${purchase.installments_count}x`}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {purchase.card?.name ?? "Cartao"} • {purchase.category?.name ?? "Categoria"} • {formatDate(purchase.purchase_date)}
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
          <ProgressBar
            value={progress.percentage}
            tone={progress.percentage >= 100 ? "safe" : progress.percentage >= 80 ? "warning" : "safe"}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{progress.percentage}% concluido</span>
            <span>
              {progress.paidInstallments} de {purchase.installments_count} parcelas
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
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const normalizedQuery = normalizeSearchTerm(deferredSearchTerm);
  const filteredPurchases = purchases.filter((purchase) => matchesPurchaseSearch(purchase, normalizedQuery));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compras cadastradas</CardTitle>
        <CardDescription>Edite parcelas, compras fixas e acompanhe o andamento ate a finalizacao.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {purchases.length > 0 ? (
          <>
            <div className="space-y-2">
              <label htmlFor="credit-card-purchase-search" className="block text-sm font-medium">
                Buscar compras
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="credit-card-purchase-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Busque por descricao, cartao, categoria, valor, data ou observacao"
                  className="pl-11 pr-11"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredPurchases.length} {filteredPurchases.length === 1 ? "compra encontrada" : "compras encontradas"}
              </p>
            </div>

            {filteredPurchases.length > 0 ? (
              filteredPurchases.map((purchase) => (
                <PurchaseCard key={purchase.id} purchase={purchase} month={month} year={year} />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-secondary/30 px-4 py-12 text-center text-sm text-muted-foreground">
                Nenhuma compra encontrada para a busca informada.
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/30 px-4 py-12 text-center text-sm text-muted-foreground">
            Nenhuma compra cadastrada em cartoes ainda.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteCreditCardAction } from "@/app/actions/credit-cards";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/hooks/use-notifications";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CreditCard } from "@/types/finance";

function DeleteCardButton({ cardId }: { cardId: string }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Excluir este cartão também remove as compras cadastradas nele. Deseja continuar?")) return;

        startTransition(async () => {
          const result = await deleteCreditCardAction(cardId);
          notify({ variant: result.success ? "success" : "error", message: result.message });
          router.refresh();
        });
      }}
      aria-label="Excluir cartão"
    >
      <Trash2 className="h-4 w-4 text-danger" />
    </Button>
  );
}

export function CreditCardList({ cards }: { cards: CreditCard[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cartões cadastrados</CardTitle>
        <CardDescription>Gerencie fechamento, vencimento e limite de cada cartão.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {cards.map((card) => (
          <div key={card.id} className="overflow-hidden rounded-3xl border border-border/70 bg-secondary/20">
            <div className="h-2" style={{ backgroundColor: card.color }} />
            <div className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">{card.name}</p>
                <p className="text-sm text-muted-foreground">
                  {card.last_four ? `Final ${card.last_four} • ` : ""}Fecha dia {card.closing_day} • Vence dia {card.due_day}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Limite: {formatCurrency(card.limit_amount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/cartoes?editCard=${card.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                  <PencilLine className="h-4 w-4" />
                </Link>
                <DeleteCardButton cardId={card.id} />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

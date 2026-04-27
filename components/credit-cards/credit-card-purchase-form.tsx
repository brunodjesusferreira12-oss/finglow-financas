"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { upsertCreditCardPurchaseAction } from "@/app/actions/credit-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/hooks/use-notifications";
import { creditCardPurchaseSchema, type CreditCardPurchaseFormValues } from "@/lib/validations/credit-cards";
import type { Category, CreditCard, CreditCardPurchaseWithRelations } from "@/types/finance";

function buildPurchaseFormDefaults(
  initialData: CreditCardPurchaseWithRelations | null | undefined,
  cards: CreditCard[],
  categories: Category[],
): CreditCardPurchaseFormValues {
  return {
    id: initialData?.id,
    cardId: initialData?.card_id ?? cards[0]?.id ?? "",
    categoryId: initialData?.category_id ?? categories[0]?.id ?? "",
    description: initialData?.description ?? "",
    amountTotal: initialData?.amount_total ?? 0,
    purchaseDate: initialData?.purchase_date ?? new Date().toISOString().slice(0, 10),
    installmentsCount: initialData?.installments_count ?? 1,
    isFixed: initialData?.is_fixed ?? false,
    notes: initialData?.notes ?? "",
  };
}

export function CreditCardPurchaseForm({
  cards,
  categories,
  initialData,
}: {
  cards: CreditCard[];
  categories: Category[];
  initialData?: CreditCardPurchaseWithRelations | null;
}) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const defaultValues = useMemo(
    () => buildPurchaseFormDefaults(initialData, cards, categories),
    [initialData, cards, categories],
  );
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreditCardPurchaseFormValues>({
    resolver: zodResolver(creditCardPurchaseSchema),
    defaultValues,
  });

  const isFixed = watch("isFixed");

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (isFixed) {
      setValue("installmentsCount", 1);
    }
  }, [isFixed, setValue]);

  const onSubmit = (values: CreditCardPurchaseFormValues) => {
    startTransition(async () => {
      const result = await upsertCreditCardPurchaseAction(values);
      notify({ variant: result.success ? "success" : "error", message: result.message });

      if (result.success) {
        router.replace("/cartoes");
        router.refresh();
      }
    });
  };

  const disabled = cards.length === 0 || categories.length === 0;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{initialData ? "Editar compra" : "Nova compra no cartão"}</CardTitle>
        <CardDescription>
          Cadastre compras parceladas ou fixas. A fatura mensal calcula automaticamente a parcela atual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {disabled ? (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-5 text-sm text-muted-foreground">
              Cadastre pelo menos um cartão e uma categoria de despesa antes de adicionar compras.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
            <label className="text-sm font-medium">Cartão</label>
                <Select {...register("cardId")}>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                    </option>
                  ))}
                </Select>
                {errors.cardId ? <p className="text-sm text-danger">{errors.cardId.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select {...register("categoryId")}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                {errors.categoryId ? <p className="text-sm text-danger">{errors.categoryId.message}</p> : null}
              </div>
            </div>

            <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
              <Input placeholder="Ex.: Notebook, Spotify, Mercado" {...register("description")} />
              {errors.description ? <p className="text-sm text-danger">{errors.description.message}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor total</label>
                <Input type="number" min={0} step="0.01" {...register("amountTotal")} />
                {errors.amountTotal ? <p className="text-sm text-danger">{errors.amountTotal.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data da compra</label>
                <Input type="date" {...register("purchaseDate")} />
                {errors.purchaseDate ? <p className="text-sm text-danger">{errors.purchaseDate.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Parcelas</label>
                <Input type="number" min={1} max={360} disabled={isFixed} {...register("installmentsCount")} />
                {errors.installmentsCount ? <p className="text-sm text-danger">{errors.installmentsCount.message}</p> : null}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border accent-primary" {...register("isFixed")} />
              <span>
                <span className="block font-medium">Compra fixa mensal</span>
                <span className="text-muted-foreground">Use para assinaturas e cobranças recorrentes, como streaming, internet ou academia.</span>
              </span>
            </label>

            <div className="space-y-2">
            <label className="text-sm font-medium">Observação</label>
              <Textarea placeholder="Opcional" {...register("notes")} />
              {errors.notes ? <p className="text-sm text-danger">{errors.notes.message}</p> : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner /> : null}
                {initialData ? "Salvar compra" : "Cadastrar compra"}
              </Button>
              {initialData ? (
                <Button type="button" variant="ghost" onClick={() => router.replace("/cartoes")}>
                Cancelar edição
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

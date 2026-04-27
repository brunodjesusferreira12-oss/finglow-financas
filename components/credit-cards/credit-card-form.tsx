"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { upsertCreditCardAction } from "@/app/actions/credit-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/use-notifications";
import { creditCardSchema, type CreditCardFormValues } from "@/lib/validations/credit-cards";
import type { CreditCard } from "@/types/finance";

export function CreditCardForm({ initialData }: { initialData?: CreditCard | null }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name ?? "",
      lastFour: initialData?.last_four ?? "",
      closingDay: initialData?.closing_day ?? 25,
      dueDay: initialData?.due_day ?? 10,
      limitAmount: initialData?.limit_amount ?? 0,
      color: initialData?.color ?? "#0f766e",
    },
  });

  const onSubmit = (values: CreditCardFormValues) => {
    startTransition(async () => {
      const result = await upsertCreditCardAction(values);
      notify({ variant: result.success ? "success" : "error", message: result.message });

      if (result.success) {
        router.replace("/cartoes");
        router.refresh();
      }
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{initialData ? "Editar cartão" : "Novo cartão"}</CardTitle>
        <CardDescription>Cadastre vários cartões para separar faturas, limites, vencimentos e compras parceladas.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do cartão</label>
            <Input placeholder="Ex.: Nubank Roxinho, Inter, Itau" {...register("name")} />
            {errors.name ? <p className="text-sm text-danger">{errors.name.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ultimos 4 digitos</label>
              <Input inputMode="numeric" maxLength={4} placeholder="1234" {...register("lastFour")} />
              {errors.lastFour ? <p className="text-sm text-danger">{errors.lastFour.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <Input type="color" className="h-11 p-2" {...register("color")} />
              {errors.color ? <p className="text-sm text-danger">{errors.color.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha dia</label>
              <Input type="number" min={1} max={31} {...register("closingDay")} />
              {errors.closingDay ? <p className="text-sm text-danger">{errors.closingDay.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vence dia</label>
              <Input type="number" min={1} max={31} {...register("dueDay")} />
              {errors.dueDay ? <p className="text-sm text-danger">{errors.dueDay.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Limite</label>
              <Input type="number" min={0} step="0.01" {...register("limitAmount")} />
              {errors.limitAmount ? <p className="text-sm text-danger">{errors.limitAmount.message}</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner /> : null}
              {initialData ? "Salvar cartão" : "Cadastrar cartão"}
            </Button>
            {initialData ? (
              <Button type="button" variant="ghost" onClick={() => router.replace("/cartoes")}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

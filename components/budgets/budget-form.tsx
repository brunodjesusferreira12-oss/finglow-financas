"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { upsertBudgetAction } from "@/app/actions/budgets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/use-notifications";
import { MONTH_NAMES } from "@/lib/constants";
import { budgetSchema, type BudgetFormValues } from "@/lib/validations/budgets";
import type { BudgetWithCategory, Category } from "@/types/finance";

export function BudgetForm({
  categories,
  initialData,
  month,
  year,
}: {
  categories: Category[];
  initialData?: BudgetWithCategory | null;
  month: number;
  year: number;
}) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      id: initialData?.id,
      categoryId: initialData?.category_id ?? "",
      month: initialData?.month ?? month,
      year: initialData?.year ?? year,
      limitAmount: initialData?.limit_amount ?? 0,
    },
  });

  const onSubmit = (values: BudgetFormValues) => {
    startTransition(async () => {
      const result = await upsertBudgetAction(values);
      notify({ variant: result.success ? "success" : "error", message: result.message });

      if (result.success) {
        router.replace(`/orcamentos?month=${values.month}&year=${values.year}`);
        router.refresh();
      }
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{initialData ? "Editar orçamento" : "Novo orçamento"}</CardTitle>
        <CardDescription>Defina um limite mensal por categoria de despesa e acompanhe o consumo em tempo real.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select {...register("categoryId")}>
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {errors.categoryId ? <p className="text-sm text-danger">{errors.categoryId.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mes</label>
              <Select {...register("month")}>
                {MONTH_NAMES.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </Select>
              {errors.month ? <p className="text-sm text-danger">{errors.month.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Input type="number" min="2000" max="2100" {...register("year")} />
              {errors.year ? <p className="text-sm text-danger">{errors.year.message}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Limite mensal</label>
            <Input type="number" step="0.01" min="0" placeholder="0,00" {...register("limitAmount")} />
            {errors.limitAmount ? <p className="text-sm text-danger">{errors.limitAmount.message}</p> : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner /> : null}
              {initialData ? "Salvar alterações" : "Criar orçamento"}
            </Button>
            {initialData ? (
              <Button type="button" variant="ghost" onClick={() => router.replace(`/orcamentos?month=${month}&year=${year}`)}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

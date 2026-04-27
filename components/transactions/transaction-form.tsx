"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { upsertTransactionAction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/hooks/use-notifications";
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/transactions";
import type { Category, TransactionWithCategory } from "@/types/finance";

export function TransactionForm({
  categories,
  initialData,
}: {
  categories: Category[];
  initialData?: TransactionWithCategory | null;
}) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      id: initialData?.id,
      description: initialData?.description ?? "",
      amount: initialData?.amount ?? 0,
      type: initialData?.type ?? "expense",
      categoryId: initialData?.category_id ?? "",
      transactionDate: initialData?.transaction_date ?? new Date().toISOString().slice(0, 10),
      notes: initialData?.notes ?? "",
    },
  });

  const currentType = watch("type");
  const selectedCategoryId = watch("categoryId");
  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === currentType),
    [categories, currentType],
  );

  useEffect(() => {
    if (!availableCategories.some((category) => category.id === selectedCategoryId)) {
      setValue("categoryId", "");
    }
  }, [availableCategories, selectedCategoryId, setValue]);

  const onSubmit = (values: TransactionFormValues) => {
    startTransition(async () => {
      const result = await upsertTransactionAction(values);

      if (!result.success) {
        notify({ variant: "error", message: result.message });
        return;
      }

      notify({ variant: "success", message: result.message });
      router.replace("/transacoes");
      router.refresh();
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{initialData ? "Editar transação" : "Nova transação"}</CardTitle>
        <CardDescription>Preencha os dados abaixo para registrar uma receita ou despesa com validacao segura.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input placeholder="Ex.: Supermercado do mes" {...register("description")} />
            {errors.description ? <p className="text-sm text-danger">{errors.description.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor</label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" {...register("amount")} />
              {errors.amount ? <p className="text-sm text-danger">{errors.amount.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input type="date" {...register("transactionDate")} />
              {errors.transactionDate ? <p className="text-sm text-danger">{errors.transactionDate.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select {...register("type")}>
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </Select>
              {errors.type ? <p className="text-sm text-danger">{errors.type.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select {...register("categoryId")}>
                <option value="">Selecione</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              {errors.categoryId ? <p className="text-sm text-danger">{errors.categoryId.message}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observação</label>
            <Textarea placeholder="Opcional: detalhes adicionais sobre a movimentacao" {...register("notes")} />
            {errors.notes ? <p className="text-sm text-danger">{errors.notes.message}</p> : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner /> : null}
              {initialData ? "Salvar alterações" : "Criar transação"}
            </Button>
            {initialData ? (
              <Button type="button" variant="ghost" onClick={() => router.replace("/transacoes")}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { upsertFinancialGoalAction } from "@/app/actions/financial-goals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/hooks/use-notifications";
import { GOAL_PRIORITY_OPTIONS, GOAL_STATUS_OPTIONS } from "@/lib/constants";
import { financialGoalSchema, type FinancialGoalFormValues } from "@/lib/validations/financial-goals";
import { toISODate } from "@/lib/utils";
import type { Category, FinancialGoalProgress } from "@/types/finance";

function getDefaultDates() {
  const startDate = new Date();
  const deadline = new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate());

  return {
    startDate: toISODate(startDate),
    deadline: toISODate(deadline),
  };
}

export function FinancialGoalForm({
  categories,
  initialData,
}: {
  categories: Category[];
  initialData?: FinancialGoalProgress | null;
}) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const defaults = getDefaultDates();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FinancialGoalFormValues>({
    resolver: zodResolver(financialGoalSchema),
    defaultValues: {
      id: initialData?.id,
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      targetAmount: initialData?.targetAmount ?? 0,
      currentAmount: initialData?.currentAmount ?? 0,
      startDate: initialData?.start_date ?? defaults.startDate,
      deadline: initialData?.deadline ?? defaults.deadline,
      status: initialData?.status ?? "in_progress",
      categoryId: initialData?.category_id ?? "",
      priority: initialData?.priority ?? "medium",
    },
  });

  const onSubmit = (values: FinancialGoalFormValues) => {
    startTransition(async () => {
      const result = await upsertFinancialGoalAction(values);
      notify({ variant: result.success ? "success" : "error", message: result.message });

      if (result.success) {
        router.replace("/metas");
        router.refresh();
      }
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{initialData ? "Editar meta" : "Nova meta"}</CardTitle>
        <CardDescription>Cadastre objetivos financeiros com valor-alvo, prazo, prioridade e acompanhamento de aportes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Titulo da meta</label>
            <Input placeholder="Ex.: Reserva de emergencia, viagem, carro" {...register("title")} />
            {errors.title ? <p className="text-sm text-danger">{errors.title.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select {...register("categoryId")}>
                <option value="">Sem categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              {errors.categoryId ? <p className="text-sm text-danger">{errors.categoryId.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select {...register("priority")}>
                {GOAL_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.priority ? <p className="text-sm text-danger">{errors.priority.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor-alvo</label>
              <Input type="number" min="0.01" step="0.01" placeholder="0,00" {...register("targetAmount")} />
              {errors.targetAmount ? <p className="text-sm text-danger">{errors.targetAmount.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor acumulado</label>
              <Input type="number" min="0" step="0.01" placeholder="0,00" {...register("currentAmount")} />
              {errors.currentAmount ? <p className="text-sm text-danger">{errors.currentAmount.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de inicio</label>
              <Input type="date" {...register("startDate")} />
              {errors.startDate ? <p className="text-sm text-danger">{errors.startDate.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data limite</label>
              <Input type="date" {...register("deadline")} />
              {errors.deadline ? <p className="text-sm text-danger">{errors.deadline.message}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select {...register("status")}>
              {GOAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors.status ? <p className="text-sm text-danger">{errors.status.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea placeholder="Descreva o objetivo, estrategia ou observacoes importantes desta meta." {...register("description")} />
            {errors.description ? <p className="text-sm text-danger">{errors.description.message}</p> : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner /> : null}
              {initialData ? "Salvar alterações" : "Criar meta"}
            </Button>
            {initialData ? (
              <Button type="button" variant="ghost" onClick={() => router.replace("/metas")}>
              Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { upsertCategoryAction } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/use-notifications";
import { categorySchema, type CategoryFormValues } from "@/lib/validations/categories";
import type { Category } from "@/types/finance";

export function CategoryForm({ initialData }: { initialData?: Category | null }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name ?? "",
      type: initialData?.type ?? "expense",
    },
  });

  const onSubmit = (values: CategoryFormValues) => {
    startTransition(async () => {
      const result = await upsertCategoryAction(values);
      notify({ variant: result.success ? "success" : "error", message: result.message });

      if (result.success) {
        router.replace("/categorias");
        router.refresh();
      }
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{initialData ? "Editar categoria" : "Nova categoria"}</CardTitle>
        <CardDescription>Crie categorias separadas por tipo para evitar inconsistências nos relatórios e orçamentos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input placeholder="Ex.: Moradia, Salario, Freelance" {...register("name")} />
            {errors.name ? <p className="text-sm text-danger">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <Select {...register("type")}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </Select>
            {errors.type ? <p className="text-sm text-danger">{errors.type.message}</p> : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner /> : null}
              {initialData ? "Salvar alterações" : "Criar categoria"}
            </Button>
            {initialData ? (
              <Button type="button" variant="ghost" onClick={() => router.replace("/categorias")}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteCategoryAction } from "@/app/actions/categories";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/finance";

function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Deseja excluir esta categoria?")) return;

        startTransition(async () => {
          const result = await deleteCategoryAction(categoryId);
          notify({ variant: result.success ? "success" : "error", message: result.message });
          router.refresh();
        });
      }}
      aria-label="Excluir categoria"
    >
      <Trash2 className="h-4 w-4 text-danger" />
    </Button>
  );
}

export function CategoryList({ categories }: { categories: Category[] }) {
  const incomeCount = categories.filter((category) => category.type === "income").length;
  const expenseCount = categories.filter((category) => category.type === "expense").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de categorias</CardTitle>
        <CardDescription>
          {incomeCount} de receita e {expenseCount} de despesa cadastradas nesta conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/70 bg-secondary/20 p-4">
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-sm text-muted-foreground">Atualizada em {new Date(category.updated_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={category.type === "income" ? "success" : "danger"}>
                {category.type === "income" ? "Receita" : "Despesa"}
              </Badge>
              <Link href={`/categorias?edit=${category.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                <PencilLine className="h-4 w-4" />
              </Link>
              <DeleteCategoryButton categoryId={category.id} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

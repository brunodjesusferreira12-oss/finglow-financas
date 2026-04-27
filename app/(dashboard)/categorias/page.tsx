import { Shapes } from "lucide-react";

import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireUser } from "@/lib/auth";
import { getSingleParam } from "@/lib/utils";
import { getCategories } from "@/services/category-service";
import type { Category } from "@/types/finance";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CategoriesPage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  let categories: Category[] = [];
  let categoriesError: string | null = null;

  try {
    categories = (await getCategories(user.id)) as Category[];
  } catch (error) {
    categoriesError = error instanceof Error ? error.message : "Não foi possível carregar as categorias agora.";
  }

  const editId = getSingleParam(params.edit);
  const editingCategory = categories.find((category) => category.id === editId) ?? null;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Categorias"
        description="Organize suas receitas e despesas por grupos personalizados e mantenha o cadastro limpo por usuário."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <CategoryForm initialData={editingCategory} />
        {categoriesError ? (
          <EmptyState
            icon={Shapes}
            title="Não foi possível carregar categorias"
            description={categoriesError}
          />
        ) : categories.length > 0 ? (
          <CategoryList categories={categories} />
        ) : (
          <EmptyState
            icon={Shapes}
            title="Você ainda não criou categorias"
            description="Crie categorias separadas para receitas e despesas. Isso ajuda nos filtros, gráficos e orçamentos."
          />
        )}
      </div>
    </div>
  );
}

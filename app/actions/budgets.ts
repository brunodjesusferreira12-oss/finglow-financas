"use server";

import { revalidatePath } from "next/cache";

import { failureResult, successResult, unexpectedErrorResult, validationErrorResult } from "@/lib/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { budgetSchema, type BudgetFormValues } from "@/lib/validations/budgets";
import type { Database } from "@/types/database";
import type { TransactionType } from "@/types/finance";

async function getAuthenticatedUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id };
}

export async function upsertBudgetAction(values: BudgetFormValues) {
  const parsed = budgetSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const { supabase, userId } = await getAuthenticatedUserId();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    const categoryQuery = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", parsed.data.categoryId)
      .eq("user_id", userId)
      .maybeSingle();

    const category = categoryQuery.data as { id: string; type: TransactionType } | null;

    if (!category || category.type !== "expense") {
    return failureResult("O orçamento precisa estar ligado a uma categoria de despesa da sua conta.");
    }

    const insertPayload: Database["public"]["Tables"]["budgets"]["Insert"] = {
      user_id: userId,
      category_id: parsed.data.categoryId,
      month: parsed.data.month,
      year: parsed.data.year,
      limit_amount: parsed.data.limitAmount,
    };

    const updatePayload: Database["public"]["Tables"]["budgets"]["Update"] = {
      category_id: parsed.data.categoryId,
      month: parsed.data.month,
      year: parsed.data.year,
      limit_amount: parsed.data.limitAmount,
    };

    const response = parsed.data.id
      ? await supabase.from("budgets").update(updatePayload as never).eq("id", parsed.data.id).eq("user_id", userId)
      : await supabase.from("budgets").insert(insertPayload as never);

    if (response.error) {
      const duplicated = response.error.message.toLowerCase().includes("duplicate");
    return failureResult(duplicated ? "Já existe um orçamento para essa categoria neste mês." : "Não foi possível salvar o orçamento.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/orcamentos");
    revalidatePath("/relatorios");
    return successResult(parsed.data.id ? "Orçamento atualizado com sucesso." : "Orçamento criado com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao salvar o orçamento.");
  }
}

export async function deleteBudgetAction(budgetId: string) {
  try {
    const { supabase, userId } = await getAuthenticatedUserId();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    const { error } = await supabase.from("budgets").delete().eq("id", budgetId).eq("user_id", userId);

    if (error) {
    return failureResult("Não foi possível excluir o orçamento.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/orcamentos");
    revalidatePath("/relatorios");
    return successResult("Orçamento excluído com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao excluir o orçamento.");
  }
}

"use server";

import { revalidatePath } from "next/cache";

import { failureResult, successResult, unexpectedErrorResult, validationErrorResult } from "@/lib/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/transactions";
import type { Database } from "@/types/database";
import type { TransactionType } from "@/types/finance";

async function getAuthenticatedUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id };
}

export async function upsertTransactionAction(values: TransactionFormValues) {
  const parsed = transactionSchema.safeParse(values);

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

    if (!category) {
    return failureResult("A categoria selecionada não pertence à sua conta.");
    }

    if (category.type !== parsed.data.type) {
    return failureResult("O tipo da transação precisa combinar com o tipo da categoria.");
    }

    const insertPayload: Database["public"]["Tables"]["transactions"]["Insert"] = {
      user_id: userId,
      category_id: parsed.data.categoryId,
      description: parsed.data.description,
      amount: parsed.data.amount,
      type: parsed.data.type,
      transaction_date: parsed.data.transactionDate,
      notes: parsed.data.notes || null,
    };

    const updatePayload: Database["public"]["Tables"]["transactions"]["Update"] = {
      category_id: parsed.data.categoryId,
      description: parsed.data.description,
      amount: parsed.data.amount,
      type: parsed.data.type,
      transaction_date: parsed.data.transactionDate,
      notes: parsed.data.notes || null,
    };

    const response = parsed.data.id
      ? await supabase.from("transactions").update(updatePayload as never).eq("id", parsed.data.id).eq("user_id", userId)
      : await supabase.from("transactions").insert(insertPayload as never);

    if (response.error) {
    return failureResult("Não foi possível salvar a transação.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/transacoes");
    revalidatePath("/orcamentos");
    revalidatePath("/relatorios");
    return successResult(parsed.data.id ? "Transação atualizada com sucesso." : "Transação criada com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao salvar a transação.");
  }
}

export async function deleteTransactionAction(transactionId: string) {
  try {
    const { supabase, userId } = await getAuthenticatedUserId();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    const { error } = await supabase.from("transactions").delete().eq("id", transactionId).eq("user_id", userId);

    if (error) {
    return failureResult("Não foi possível excluir a transação.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/transacoes");
    revalidatePath("/orcamentos");
    revalidatePath("/relatorios");
    return successResult("Transação excluída com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao excluir a transação.");
  }
}

"use server";

import { revalidatePath } from "next/cache";

import { failureResult, successResult, unexpectedErrorResult, validationErrorResult } from "@/lib/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  creditCardPurchaseSchema,
  creditCardSchema,
  type CreditCardFormValues,
  type CreditCardPurchaseFormValues,
} from "@/lib/validations/credit-cards";
import type { Database } from "@/types/database";
import type { TransactionType } from "@/types/finance";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function getAuthenticatedUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, userId: user?.id };
}

function revalidateCreditCardPaths() {
  revalidatePath("/cartoes");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
}

function getSupabaseErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string };
  return [candidate.code, candidate.message, candidate.details, candidate.hint].filter(Boolean).join(" ");
}

function explainCreditCardDatabaseError(error: unknown) {
  const message = getSupabaseErrorMessage(error).toLowerCase();

  if (message.includes("42p01") || message.includes("does not exist") || message.includes("schema cache")) {
    return "As tabelas de cartões ainda não existem no Supabase. Execute o SQL atualizado em supabase/schema.sql no editor SQL do Supabase.";
  }

  if (message.includes("row-level security") || message.includes("rls") || message.includes("violates row-level security")) {
    return "O Supabase bloqueou a operação por segurança (RLS). Reexecute as policies de cartões do arquivo supabase/schema.sql.";
  }

  if (message.includes("foreign key") || message.includes("credit_cards_user_id_fkey")) {
    return "Não encontrei seu perfil no banco. Saia, entre novamente e tente de novo; se persistir, reexecute o SQL do Supabase.";
  }

    return "Não foi possível salvar o cartão. Confira os dados e tente novamente.";
}

async function ensureProfileExists(supabase: SupabaseServerClient, user: NonNullable<Awaited<ReturnType<SupabaseServerClient["auth"]["getUser"]>>["data"]["user"]>) {
  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const profilePayload: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: user.id,
    email: user.email ?? "",
    full_name: fullName || null,
  };

  const { error } = await supabase.from("profiles").upsert(profilePayload as never, { onConflict: "id" });

  return error;
}

export async function upsertCreditCardAction(values: CreditCardFormValues) {
  const parsed = creditCardSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const { supabase, user, userId } = await getAuthenticatedUserId();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    if (user) {
      const profileError = await ensureProfileExists(supabase, user);

      if (profileError) {
    console.error("Erro ao sincronizar perfil antes de salvar cartão:", profileError);
        return failureResult(explainCreditCardDatabaseError(profileError));
      }
    }

    const insertPayload: Database["public"]["Tables"]["credit_cards"]["Insert"] = {
      user_id: userId,
      name: parsed.data.name,
      last_four: parsed.data.lastFour || null,
      closing_day: parsed.data.closingDay,
      due_day: parsed.data.dueDay,
      limit_amount: parsed.data.limitAmount,
      color: parsed.data.color,
    };

    const updatePayload: Database["public"]["Tables"]["credit_cards"]["Update"] = {
      name: parsed.data.name,
      last_four: parsed.data.lastFour || null,
      closing_day: parsed.data.closingDay,
      due_day: parsed.data.dueDay,
      limit_amount: parsed.data.limitAmount,
      color: parsed.data.color,
    };

    const response = parsed.data.id
      ? await supabase.from("credit_cards").update(updatePayload as never).eq("id", parsed.data.id).eq("user_id", userId)
      : await supabase.from("credit_cards").insert(insertPayload as never);

    if (response.error) {
    console.error("Erro ao salvar cartão:", response.error);
      return failureResult(explainCreditCardDatabaseError(response.error));
    }

    revalidateCreditCardPaths();
    return successResult(parsed.data.id ? "Cartão atualizado com sucesso." : "Cartão cadastrado com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao salvar o cartão.");
  }
}

export async function deleteCreditCardAction(cardId: string) {
  try {
    const { supabase, user, userId } = await getAuthenticatedUserId();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    const { error } = await supabase.from("credit_cards").delete().eq("id", cardId).eq("user_id", userId);

    if (error) {
    return failureResult("Não foi possível excluir o cartão.");
    }

    revalidateCreditCardPaths();
    return successResult("Cartão excluído com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao excluir o cartão.");
  }
}

export async function upsertCreditCardPurchaseAction(values: CreditCardPurchaseFormValues) {
  const parsed = creditCardPurchaseSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const { supabase, user, userId } = await getAuthenticatedUserId();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    if (user) {
      const profileError = await ensureProfileExists(supabase, user);

      if (profileError) {
    console.error("Erro ao sincronizar perfil antes de salvar compra do cartão:", profileError);
        return failureResult(explainCreditCardDatabaseError(profileError));
      }
    }

    const [{ data: card }, { data: category }] = await Promise.all([
      supabase.from("credit_cards").select("id").eq("id", parsed.data.cardId).eq("user_id", userId).maybeSingle(),
      supabase.from("categories").select("id, type").eq("id", parsed.data.categoryId).eq("user_id", userId).maybeSingle(),
    ]);

    const typedCategory = category as { id: string; type: TransactionType } | null;

    if (!card) {
    return failureResult("O cartão selecionado não pertence à sua conta.");
    }

    if (!typedCategory || typedCategory.type !== "expense") {
      return failureResult("A categoria da compra precisa ser uma categoria de despesa da sua conta.");
    }

    const normalizedInstallments = parsed.data.isFixed ? 1 : parsed.data.installmentsCount;

    const insertPayload: Database["public"]["Tables"]["credit_card_purchases"]["Insert"] = {
      user_id: userId,
      card_id: parsed.data.cardId,
      category_id: parsed.data.categoryId,
      description: parsed.data.description,
      amount_total: parsed.data.amountTotal,
      purchase_date: parsed.data.purchaseDate,
      installments_count: normalizedInstallments,
      is_fixed: parsed.data.isFixed,
      notes: parsed.data.notes || null,
    };

    const updatePayload: Database["public"]["Tables"]["credit_card_purchases"]["Update"] = {
      card_id: parsed.data.cardId,
      category_id: parsed.data.categoryId,
      description: parsed.data.description,
      amount_total: parsed.data.amountTotal,
      purchase_date: parsed.data.purchaseDate,
      installments_count: normalizedInstallments,
      is_fixed: parsed.data.isFixed,
      notes: parsed.data.notes || null,
    };

    const response = parsed.data.id
      ? await supabase
          .from("credit_card_purchases")
          .update(updatePayload as never)
          .eq("id", parsed.data.id)
          .eq("user_id", userId)
      : await supabase.from("credit_card_purchases").insert(insertPayload as never);

    if (response.error) {
    console.error("Erro ao salvar compra do cartão:", response.error);
      return failureResult(explainCreditCardDatabaseError(response.error));
    }

    revalidateCreditCardPaths();
    return successResult(parsed.data.id ? "Compra atualizada com sucesso." : "Compra cadastrada com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao salvar a compra.");
  }
}

export async function deleteCreditCardPurchaseAction(purchaseId: string) {
  try {
    const { supabase, userId } = await getAuthenticatedUserId();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    const { error } = await supabase.from("credit_card_purchases").delete().eq("id", purchaseId).eq("user_id", userId);

    if (error) {
    return failureResult("Não foi possível excluir a compra.");
    }

    revalidateCreditCardPaths();
    return successResult("Compra excluida com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao excluir a compra.");
  }
}

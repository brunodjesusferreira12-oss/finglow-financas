"use server";

import { revalidatePath } from "next/cache";

import { failureResult, successResult, unexpectedErrorResult, validationErrorResult } from "@/lib/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  financialGoalContributionSchema,
  financialGoalSchema,
  type FinancialGoalContributionFormValues,
  type FinancialGoalFormValues,
} from "@/lib/validations/financial-goals";
import type { Database } from "@/types/database";
import type { GoalStatus } from "@/types/finance";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function getAuthenticatedContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, userId: user?.id };
}

function revalidateGoalPaths() {
  revalidatePath("/metas");
  revalidatePath("/dashboard");
}

function getSupabaseErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string };
  return [candidate.code, candidate.message, candidate.details, candidate.hint].filter(Boolean).join(" ");
}

function explainFinancialGoalDatabaseError(error: unknown) {
  const message = getSupabaseErrorMessage(error).toLowerCase();

  if (message.includes("42p01") || message.includes("does not exist") || message.includes("schema cache")) {
    return "A tabela de metas ainda não existe no Supabase. Execute o SQL de metas em supabase/goals-addon.sql.";
  }

  if (message.includes("row-level security") || message.includes("rls") || message.includes("violates row-level security")) {
    return "O Supabase bloqueou a operação por segurança (RLS). Reexecute as policies do SQL de metas.";
  }

  if (message.includes("foreign key") || message.includes("financial_goals_user_id_fkey")) {
    return "Não encontrei seu perfil no banco. Saia, entre novamente e tente de novo; se persistir, reexecute o SQL.";
  }

  return "Não foi possível salvar a meta agora. Tente novamente em instantes.";
}

async function ensureProfileExists(
  supabase: SupabaseServerClient,
  user: NonNullable<Awaited<ReturnType<SupabaseServerClient["auth"]["getUser"]>>["data"]["user"]>,
) {
  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const profilePayload: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: user.id,
    email: user.email ?? "",
    full_name: fullName || null,
  };

  const { error } = await supabase.from("profiles").upsert(profilePayload as never, { onConflict: "id" });

  return error;
}

async function validateGoalCategoryOwnership(supabase: SupabaseServerClient, userId: string, categoryId?: string | null) {
  if (!categoryId) return true;

  const { data } = await supabase.from("categories").select("id").eq("id", categoryId).eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export async function upsertFinancialGoalAction(values: FinancialGoalFormValues) {
  const parsed = financialGoalSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const { supabase, user, userId } = await getAuthenticatedContext();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    if (user) {
      const profileError = await ensureProfileExists(supabase, user);

      if (profileError) {
        console.error("Erro ao sincronizar perfil antes de salvar meta:", profileError);
        return failureResult(explainFinancialGoalDatabaseError(profileError));
      }
    }

    const normalizedCategoryId = parsed.data.categoryId || null;
    const hasValidCategory = await validateGoalCategoryOwnership(supabase, userId, normalizedCategoryId);

    if (!hasValidCategory) {
    return failureResult("A categoria escolhida não pertence à sua conta.");
    }

    const insertPayload: Database["public"]["Tables"]["financial_goals"]["Insert"] = {
      user_id: userId,
      category_id: normalizedCategoryId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      target_amount: parsed.data.targetAmount,
      current_amount: parsed.data.currentAmount,
      start_date: parsed.data.startDate,
      deadline: parsed.data.deadline,
      status: parsed.data.status,
      priority: parsed.data.priority,
    };

    const updatePayload: Database["public"]["Tables"]["financial_goals"]["Update"] = {
      category_id: normalizedCategoryId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      target_amount: parsed.data.targetAmount,
      current_amount: parsed.data.currentAmount,
      start_date: parsed.data.startDate,
      deadline: parsed.data.deadline,
      status: parsed.data.status,
      priority: parsed.data.priority,
    };

    const response = parsed.data.id
      ? await supabase.from("financial_goals").update(updatePayload as never).eq("id", parsed.data.id).eq("user_id", userId)
      : await supabase.from("financial_goals").insert(insertPayload as never);

    if (response.error) {
      console.error("Erro ao salvar meta:", response.error);
      return failureResult(explainFinancialGoalDatabaseError(response.error));
    }

    revalidateGoalPaths();
    return successResult(parsed.data.id ? "Meta atualizada com sucesso." : "Meta criada com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao salvar a meta.");
  }
}

export async function deleteFinancialGoalAction(goalId: string) {
  try {
    const { supabase, userId } = await getAuthenticatedContext();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    const { error } = await supabase.from("financial_goals").delete().eq("id", goalId).eq("user_id", userId);

    if (error) {
    return failureResult("Não foi possível excluir a meta.");
    }

    revalidateGoalPaths();
    return successResult("Meta excluida com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao excluir a meta.");
  }
}

export async function updateFinancialGoalStatusAction(goalId: string, status: GoalStatus) {
  try {
    const { supabase, userId } = await getAuthenticatedContext();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    const { data: goal, error: goalError } = await supabase
      .from("financial_goals")
      .select("id, target_amount, current_amount")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (goalError) {
      console.error("Erro ao carregar meta para alterar status:", goalError);
      return failureResult(explainFinancialGoalDatabaseError(goalError));
    }

    if (!goal) {
    return failureResult("A meta selecionada não pertence à sua conta.");
    }

    const typedGoal = goal as { id: string; target_amount: number; current_amount: number };
    const currentAmount = Number(typedGoal.current_amount ?? 0);
    const targetAmount = Number(typedGoal.target_amount ?? 0);
    const nextCurrentAmount = status === "completed" ? Math.max(currentAmount, targetAmount) : currentAmount;
    const updatePayload: Database["public"]["Tables"]["financial_goals"]["Update"] = {
      status,
      current_amount: nextCurrentAmount,
    };

    const { error } = await supabase.from("financial_goals").update(updatePayload as never).eq("id", goalId).eq("user_id", userId);

    if (error) {
      console.error("Erro ao atualizar status da meta:", error);
      return failureResult(explainFinancialGoalDatabaseError(error));
    }

    revalidateGoalPaths();
    return successResult(
      status === "completed"
        ? "Meta marcada como concluida."
        : status === "paused"
          ? "Meta pausada com sucesso."
          : "Meta retomada com sucesso.",
    );
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao atualizar o status da meta.");
  }
}

export async function registerFinancialGoalContributionAction(values: FinancialGoalContributionFormValues) {
  const parsed = financialGoalContributionSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorResult(parsed.error, "Revise o aporte e tente novamente.");
  }

  try {
    const { supabase, userId } = await getAuthenticatedContext();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    const { data: goal, error: goalError } = await supabase
      .from("financial_goals")
      .select("id, current_amount, target_amount, status")
      .eq("id", parsed.data.goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (goalError) {
      console.error("Erro ao carregar meta para aporte:", goalError);
      return failureResult(explainFinancialGoalDatabaseError(goalError));
    }

    if (!goal) {
    return failureResult("A meta selecionada não pertence à sua conta.");
    }

    const typedGoal = goal as { id: string; current_amount: number; target_amount: number; status: GoalStatus };
    const currentAmount = Number(typedGoal.current_amount ?? 0);
    const targetAmount = Number(typedGoal.target_amount ?? 0);
    const nextCurrentAmount = currentAmount + parsed.data.amount;
    const nextStatus: GoalStatus = nextCurrentAmount >= targetAmount ? "completed" : typedGoal.status;
    const updatePayload: Database["public"]["Tables"]["financial_goals"]["Update"] = {
      current_amount: nextCurrentAmount,
      status: nextStatus,
    };

    const { error } = await supabase
      .from("financial_goals")
      .update(updatePayload as never)
      .eq("id", parsed.data.goalId)
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao registrar aporte na meta:", error);
      return failureResult(explainFinancialGoalDatabaseError(error));
    }

    revalidateGoalPaths();
    return successResult(nextStatus === "completed" ? "Aporte registrado e meta concluida." : "Aporte registrado com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao registrar o aporte.");
  }
}

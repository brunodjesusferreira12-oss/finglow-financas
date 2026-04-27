"use server";

import { revalidatePath } from "next/cache";

import { failureResult, successResult, unexpectedErrorResult, validationErrorResult } from "@/lib/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { categorySchema, type CategoryFormValues } from "@/lib/validations/categories";
import type { Database } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function getAuthenticatedUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, userId: user?.id };
}

function getSupabaseErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string };
  return [candidate.code, candidate.message, candidate.details, candidate.hint].filter(Boolean).join(" ");
}

function explainCategoryDatabaseError(error: unknown) {
  const message = getSupabaseErrorMessage(error).toLowerCase();

  if (message.includes("schema cache")) {
    return "A tabela de categorias existe, mas a API do Supabase ainda não atualizou o schema cache. Rode `NOTIFY pgrst, 'reload schema';` no SQL Editor e tente novamente.";
  }

  if (message.includes("42p01") || message.includes("does not exist")) {
    return "A tabela de categorias ainda não existe no Supabase. Execute o arquivo supabase/schema.sql no SQL Editor do Supabase.";
  }

  if (message.includes("row-level security") || message.includes("rls") || message.includes("violates row-level security")) {
    return "O Supabase bloqueou a operação por segurança (RLS). Reexecute as policies do arquivo supabase/schema.sql.";
  }

  if (message.includes("foreign key") || message.includes("categories_user_id_fkey")) {
    return "Não encontrei seu perfil no banco. Saia, entre novamente e tente de novo; se persistir, reexecute o SQL.";
  }

  return "Não foi possível salvar a categoria.";
}

function withDebugDetails(message: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return message;
  }

  const details = getSupabaseErrorMessage(error);
  return details ? `${message} Detalhe: ${details}` : message;
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

export async function upsertCategoryAction(values: CategoryFormValues) {
  const parsed = categorySchema.safeParse(values);

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
        console.error("Erro ao sincronizar perfil antes de salvar categoria:", profileError);
        return failureResult(withDebugDetails(explainCategoryDatabaseError(profileError), profileError));
      }
    }

    const insertPayload: Database["public"]["Tables"]["categories"]["Insert"] = {
      user_id: userId,
      name: parsed.data.name,
      type: parsed.data.type,
    };

    const updatePayload: Database["public"]["Tables"]["categories"]["Update"] = {
      name: parsed.data.name,
      type: parsed.data.type,
    };

    const response = parsed.data.id
      ? await supabase.from("categories").update(updatePayload as never).eq("id", parsed.data.id).eq("user_id", userId)
      : await supabase.from("categories").insert(insertPayload as never);

    if (response.error) {
      console.error("Erro ao salvar categoria:", response.error);
      const duplicated = response.error.message.toLowerCase().includes("duplicate");
      return failureResult(
        duplicated
          ? withDebugDetails("Já existe uma categoria com esse nome para esse tipo.", response.error)
          : withDebugDetails(explainCategoryDatabaseError(response.error), response.error),
      );
    }

    revalidatePath("/categorias");
    revalidatePath("/transacoes");
    revalidatePath("/orcamentos");
    revalidatePath("/dashboard");
    revalidatePath("/relatorios");
    return successResult(parsed.data.id ? "Categoria atualizada com sucesso." : "Categoria criada com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao salvar a categoria.");
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    const { supabase, userId } = await getAuthenticatedUserId();

    if (!userId) {
      return failureResult("Sua sessao expirou. Entre novamente.");
    }

    const { error } = await supabase.from("categories").delete().eq("id", categoryId).eq("user_id", userId);

    if (error) {
      return failureResult(
        error.message.toLowerCase().includes("foreign key")
        ? "Não foi possível excluir. Remova antes as transações vinculadas a essa categoria."
          : withDebugDetails(explainCategoryDatabaseError(error), error),
      );
    }

    revalidatePath("/categorias");
    revalidatePath("/transacoes");
    revalidatePath("/orcamentos");
    revalidatePath("/dashboard");
    revalidatePath("/relatorios");
    return successResult("Categoria excluida com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao excluir a categoria.");
  }
}

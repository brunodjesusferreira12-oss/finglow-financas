"use server";

import { revalidatePath } from "next/cache";

import { env } from "@/lib/env";
import { failureResult, successResult, unexpectedErrorResult, validationErrorResult } from "@/lib/action-utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type LoginFormValues,
  type RegisterFormValues,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";

function buildAuthRedirect(nextPath: string) {
  const url = new URL("/auth/confirm", env.siteUrl);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export async function loginAction(values: LoginFormValues) {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return failureResult("Não foi possível entrar. Verifique suas credenciais.");
    }

    revalidatePath("/", "layout");
    return successResult("Login realizado com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao tentar entrar.");
  }
}

export async function registerAction(values: RegisterFormValues) {
  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: buildAuthRedirect("/dashboard"),
        data: {
          full_name: parsed.data.fullName || "",
        },
      },
    });

    if (error) {
      return failureResult(error.message.includes("already registered") ? "Esse e-mail já está cadastrado." : "Não foi possível criar sua conta.");
    }

    return successResult("Conta criada. Se a confirmação por e-mail estiver ativa, confira sua caixa de entrada.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao criar a conta.");
  }
}

export async function requestPasswordResetAction(values: ForgotPasswordFormValues) {
  const parsed = forgotPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: buildAuthRedirect("/redefinir-senha"),
    });

    if (error) {
      return failureResult("Não foi possível enviar o e-mail de recuperação.");
    }

    return successResult("Enviamos um link de recuperação para o seu e-mail.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao solicitar a recuperação.");
  }
}

export async function resetPasswordAction(values: ResetPasswordFormValues) {
  const parsed = resetPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return failureResult("Não foi possível redefinir a senha. Solicite um novo link.");
    }

    return successResult("Senha atualizada com sucesso.");
  } catch (error) {
    return unexpectedErrorResult(error, "Ocorreu um erro ao redefinir a senha.");
  }
}

export async function signOutAction() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    return successResult("Sessão encerrada com segurança.");
  } catch (error) {
    return unexpectedErrorResult(error, "Não foi possível sair agora.");
  }
}

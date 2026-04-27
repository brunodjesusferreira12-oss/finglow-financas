import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Solicite%20um%20novo%20link%20de%20recuperacao.");
  }

  return (
    <AuthCard
      title="Definir nova senha"
      description="Escolha uma senha forte para voltar a acessar sua area privada."
      footerText="Não precisa mais redefinir?"
      footerLinkHref="/login"
      footerLinkLabel="Voltar ao login"
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}

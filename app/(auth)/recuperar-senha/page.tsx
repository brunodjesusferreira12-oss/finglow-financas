import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recuperar senha"
      description="Informe seu e-mail para receber um link seguro de redefinicao."
      footerText="Lembrou sua senha?"
      footerLinkHref="/login"
      footerLinkLabel="Voltar ao login"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Criar conta"
      description="Comece a organizar suas financas com um ambiente seguro e profissional."
      footerText="Já possui uma conta?"
      footerLinkHref="/login"
      footerLinkLabel="Entrar"
    >
      <RegisterForm />
    </AuthCard>
  );
}

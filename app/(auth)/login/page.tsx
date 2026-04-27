import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { getSingleParam } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await searchParams) ?? {};
  const nextPath = getSingleParam(params.next);
  const message = getSingleParam(params.message);
  const error = getSingleParam(params.error);

  return (
    <AuthCard
      title="Entrar na sua conta"
      description="Acesse seu painel financeiro com segurança em qualquer dispositivo."
      footerText="Ainda não tem uma conta?"
      footerLinkHref="/cadastro"
      footerLinkLabel="Criar conta"
    >
      <LoginForm nextPath={nextPath} message={message} error={error} />
    </AuthCard>
  );
}

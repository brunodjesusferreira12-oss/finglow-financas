"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { loginAction } from "@/app/actions/auth";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/use-notifications";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

export function LoginForm({
  nextPath,
  message,
  error,
}: {
  nextPath?: string;
  message?: string;
  error?: string;
}) {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    startTransition(async () => {
      const result = await loginAction(values);

      if (!result.success) {
        notify({ variant: "error", message: result.message });
        return;
      }

      notify({ variant: "success", message: result.message });
      router.replace(nextPath || "/dashboard");
      router.refresh();
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <AuthFormFeedback message={message} tone="success" />
      <AuthFormFeedback message={error} tone="error" />

      <div className="space-y-2">
        <label className="text-sm font-medium">E-mail</label>
        <Input type="email" placeholder="voce@exemplo.com" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium">Senha</label>
          <Link href="/recuperar-senha" className="text-sm font-medium text-primary transition hover:text-primary/80">
            Esqueci minha senha
          </Link>
        </div>
        <Input type="password" placeholder="Digite sua senha" autoComplete="current-password" {...register("password")} />
        {errors.password ? <p className="text-sm text-danger">{errors.password.message}</p> : null}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Spinner /> : null}
        Entrar
      </Button>
    </form>
  );
}

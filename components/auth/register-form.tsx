"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/use-notifications";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    startTransition(async () => {
      const result = await registerAction(values);

      if (!result.success) {
        notify({ variant: "error", message: result.message });
        return;
      }

      notify({ variant: "success", message: result.message });
      router.push("/login?message=Conta%20criada.%20Agora%20faca%20login.");
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Nome completo</label>
        <Input type="text" placeholder="Seu nome" autoComplete="name" {...register("fullName")} />
        {errors.fullName ? <p className="text-sm text-danger">{errors.fullName.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">E-mail</label>
        <Input type="email" placeholder="voce@exemplo.com" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="text-sm text-danger">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Senha</label>
        <Input type="password" placeholder="Crie uma senha forte" autoComplete="new-password" {...register("password")} />
        {errors.password ? <p className="text-sm text-danger">{errors.password.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Confirmar senha</label>
        <Input type="password" placeholder="Repita a senha" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword ? <p className="text-sm text-danger">{errors.confirmPassword.message}</p> : null}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Spinner /> : null}
        Criar conta
      </Button>
    </form>
  );
}

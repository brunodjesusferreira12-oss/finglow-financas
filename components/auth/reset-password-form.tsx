"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import { resetPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/use-notifications";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const { notify } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    startTransition(async () => {
      const result = await resetPasswordAction(values);

      if (!result.success) {
        notify({ variant: "error", message: result.message });
        return;
      }

      notify({ variant: "success", message: result.message });
      router.push("/login?message=Senha%20atualizada.%20Entre%20novamente.");
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Nova senha</label>
        <Input type="password" placeholder="Digite a nova senha" autoComplete="new-password" {...register("password")} />
        {errors.password ? <p className="text-sm text-danger">{errors.password.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Confirmar nova senha</label>
        <Input type="password" placeholder="Repita a nova senha" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword ? <p className="text-sm text-danger">{errors.confirmPassword.message}</p> : null}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Spinner /> : null}
        Salvar nova senha
      </Button>
    </form>
  );
}

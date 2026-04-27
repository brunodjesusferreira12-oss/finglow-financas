import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido.").trim(),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .max(120, "Use no maximo 120 caracteres.")
      .optional()
      .or(z.literal("")),
    email: z.string().email("Informe um e-mail valido.").trim(),
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "A senha precisa conter pelo menos uma letra.")
      .regex(/[0-9]/, "A senha precisa conter pelo menos um numero."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail valido.").trim(),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "A senha precisa conter pelo menos uma letra.")
      .regex(/[0-9]/, "A senha precisa conter pelo menos um numero."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

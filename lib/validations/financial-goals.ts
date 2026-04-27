import { z } from "zod";

export const financialGoalSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z
      .string()
      .trim()
      .min(2, "O titulo precisa ter pelo menos 2 caracteres.")
      .max(100, "Use no maximo 100 caracteres."),
    description: z
      .string()
      .trim()
      .max(400, "Use no maximo 400 caracteres.")
      .optional()
      .or(z.literal("")),
    targetAmount: z.coerce.number().positive("Informe um valor-alvo maior que zero."),
  currentAmount: z.coerce.number().min(0, "O valor acumulado não pode ser negativo."),
    startDate: z.string().min(1, "Informe a data de inicio."),
    deadline: z.string().min(1, "Informe a data limite."),
    status: z.enum(["in_progress", "completed", "paused"], {
      errorMap: () => ({ message: "Selecione o status da meta." }),
    }),
    categoryId: z.string().uuid().optional().or(z.literal("")),
    priority: z.enum(["low", "medium", "high"], {
      errorMap: () => ({ message: "Selecione a prioridade da meta." }),
    }),
  })
  .refine((value) => value.deadline >= value.startDate, {
    message: "A data limite não pode ser anterior à data de início.",
    path: ["deadline"],
  });

export const financialGoalContributionSchema = z.object({
  goalId: z.string().uuid("Meta invalida."),
  amount: z.coerce.number().positive("Informe um aporte maior que zero."),
});

export type FinancialGoalFormValues = z.infer<typeof financialGoalSchema>;
export type FinancialGoalContributionFormValues = z.infer<typeof financialGoalContributionSchema>;

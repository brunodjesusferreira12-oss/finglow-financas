import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  description: z
    .string()
    .trim()
    .min(3, "A descrição precisa ter pelo menos 3 caracteres.")
    .max(120, "Use no maximo 120 caracteres."),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Selecione se a movimentacao e receita ou despesa." }),
  }),
  categoryId: z.string().min(1, "Escolha uma categoria."),
  transactionDate: z.string().min(1, "Informe a data da transação."),
  notes: z
    .string()
    .trim()
    .max(280, "Use no maximo 280 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

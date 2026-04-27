import { z } from "zod";

export const budgetSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().min(1, "Escolha uma categoria de despesa."),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  limitAmount: z.coerce.number().positive("Informe um limite maior que zero."),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;

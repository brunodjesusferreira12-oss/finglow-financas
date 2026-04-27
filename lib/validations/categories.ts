import { z } from "zod";

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(60, "Use no maximo 60 caracteres."),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Selecione o tipo da categoria." }),
  }),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

import { z } from "zod";

export const creditCardSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome para o cartão.")
    .max(80, "Use no máximo 80 caracteres."),
  lastFour: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Use exatamente os 4 últimos dígitos.")
    .optional()
    .or(z.literal("")),
  closingDay: z.coerce.number().int().min(1, "Dia inválido.").max(31, "Dia inválido."),
  dueDay: z.coerce.number().int().min(1, "Dia inválido.").max(31, "Dia inválido."),
  limitAmount: z.coerce.number().min(0, "O limite não pode ser negativo."),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Escolha uma cor válida."),
});

export const creditCardPurchaseSchema = z
  .object({
    id: z.string().uuid().optional(),
    cardId: z.string().uuid("Escolha um cartão."),
    categoryId: z.string().uuid("Escolha uma categoria de despesa."),
    description: z
      .string()
      .trim()
      .min(3, "A descrição precisa ter pelo menos 3 caracteres.")
      .max(120, "Use no máximo 120 caracteres."),
    amountTotal: z.coerce.number().positive("Informe um valor maior que zero."),
    purchaseDate: z.string().min(1, "Informe a data da compra."),
    installmentsCount: z.coerce.number().int().min(1, "Use pelo menos 1 parcela.").max(360, "Use no máximo 360 parcelas."),
    isFixed: z.coerce.boolean().default(false),
    notes: z
      .string()
      .trim()
      .max(280, "Use no máximo 280 caracteres.")
      .optional()
      .or(z.literal("")),
  })
  .refine((value) => !value.isFixed || value.installmentsCount === 1, {
    message: "Compras fixas devem usar 1 parcela, pois se repetem mensalmente.",
    path: ["installmentsCount"],
  });

export type CreditCardFormValues = z.infer<typeof creditCardSchema>;
export type CreditCardPurchaseFormValues = z.infer<typeof creditCardPurchaseSchema>;

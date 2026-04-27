import { z } from "zod";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Use no maximo ${maxLength} caracteres.`)
    .optional()
    .or(z.literal(""));

export const exerciseLogSchema = z.object({
  exerciseId: z.string().uuid("Exercicio invalido."),
  loadUsed: optionalText(40),
  repsDone: optionalText(40),
  durationDone: optionalText(40),
  distanceDone: optionalText(40),
  notes: optionalText(600),
  completed: z.boolean().default(false),
});

export const executionFormSchema = z.object({
  executedAt: z
    .string()
    .min(1, "Informe a data e hora da execucao.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Data e hora invalidas."),
  notes: optionalText(1200),
  completed: z.boolean().default(false),
  logs: z.array(exerciseLogSchema).min(1, "Este treino precisa de pelo menos um exercicio."),
});

export type ExerciseLogFormValues = z.infer<typeof exerciseLogSchema>;
export type ExecutionFormValues = z.infer<typeof executionFormSchema>;

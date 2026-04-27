import { z } from "zod";

import { WORKOUT_CATEGORY_VALUES, WORKOUT_DAY_VALUES } from "@/lib/constants";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Use no maximo ${maxLength} caracteres.`)
    .optional()
    .or(z.literal(""));

const optionalUrl = z
  .string()
  .trim()
  .url("Informe uma URL valida.")
  .optional()
  .or(z.literal(""));

export const exerciseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Informe o nome do exercicio.").max(140, "Use no maximo 140 caracteres."),
  sets: optionalText(30),
  reps: optionalText(40),
  duration: optionalText(40),
  distance: optionalText(40),
  loadDefault: optionalText(40),
  notes: optionalText(500),
  videoUrl: optionalUrl,
  muscleGroup: optionalText(40),
  isPriority: z.boolean().default(false),
});

export const workoutSectionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Informe o titulo da secao.").max(80, "Use no maximo 80 caracteres."),
  exercises: z.array(exerciseSchema).min(1, "Cada secao precisa de pelo menos um exercicio."),
});

export const workoutFormSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome do treino.").max(120, "Use no maximo 120 caracteres."),
  scheduledDays: z.array(z.enum(WORKOUT_DAY_VALUES)).min(1, "Selecione pelo menos um dia."),
  category: z.enum(WORKOUT_CATEGORY_VALUES),
  objective: optionalText(280),
  notes: optionalText(1200),
  sections: z.array(workoutSectionSchema).min(1, "Adicione pelo menos uma secao."),
});

export type ExerciseFormValues = z.infer<typeof exerciseSchema>;
export type WorkoutSectionFormValues = z.infer<typeof workoutSectionSchema>;
export type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

export function createEmptyExercise(): ExerciseFormValues {
  return {
    name: "",
    sets: "",
    reps: "",
    duration: "",
    distance: "",
    loadDefault: "",
    notes: "",
    videoUrl: "",
    muscleGroup: "",
    isPriority: false,
  };
}

export function createEmptySection(): WorkoutSectionFormValues {
  return {
    title: "",
    exercises: [createEmptyExercise()],
  };
}

export function createWorkoutDefaults(): WorkoutFormValues {
  return {
    name: "",
    scheduledDays: ["monday"],
    category: "fortalecimento_corrida",
    objective: "",
    notes: "",
    sections: [createEmptySection()],
  };
}

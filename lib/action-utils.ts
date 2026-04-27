import { ZodError } from "zod";

import type { ActionResult } from "@/types/forms";

export function validationErrorResult<T = void>(error: ZodError, message = "Revise os campos e tente novamente."): ActionResult<T> {
  return {
    success: false,
    message,
    fieldErrors: error.flatten().fieldErrors,
  };
}

export function successResult<T = void>(message: string, data?: T): ActionResult<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function failureResult<T = void>(message: string): ActionResult<T> {
  return {
    success: false,
    message,
  };
}

export function unexpectedErrorResult<T = void>(error: unknown, fallbackMessage: string): ActionResult<T> {
  console.error(error);
  return failureResult(fallbackMessage);
}

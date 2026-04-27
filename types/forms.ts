export type ActionResult<T = void> = {
  success: boolean;
  message: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  data?: T;
};

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name?: string | null) {
  if (!name) return "U";

  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getMonthDateRange(referenceDate = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);

  return {
    start: toISODate(start),
    end: toISODate(end),
  };
}

export function getPreviousMonthDateRange(referenceDate = new Date()) {
  const previousMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
  return getMonthDateRange(previousMonth);
}

export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function safeNumber(value: unknown) {
  const parsed = typeof value === "string" ? Number(value) : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculatePercentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function buildQueryString(params: Record<string, string | undefined | null>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const stringified = query.toString();
  return stringified ? `?${stringified}` : "";
}

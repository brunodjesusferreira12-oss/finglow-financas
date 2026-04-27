import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import type { TransactionType } from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value ?? 0);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return dateFormatter.format(date);
}

export function formatMonthYear(month: number, year: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function formatPercentage(value: number) {
  return `${value.toFixed(0)}%`;
}

export function formatTransactionType(value: TransactionType) {
  return TRANSACTION_TYPE_LABELS[value];
}

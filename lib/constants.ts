import type { LucideIcon } from "lucide-react";
import {
  ChartColumnIncreasing,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Shapes,
  Target,
  WalletCards,
} from "lucide-react";

import type { GoalPriority, GoalStatus, TransactionType } from "@/types/finance";

export const APP_NAME = "FinGlow";
export const THEME_STORAGE_KEY = "finglow-theme";

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const TRANSACTION_TYPE_OPTIONS: Array<{ label: string; value: TransactionType }> = [
  { label: "Receita", value: "income" },
  { label: "Despesa", value: "expense" },
];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: "Receita",
  expense: "Despesa",
};

export const GOAL_STATUS_OPTIONS: Array<{ label: string; value: GoalStatus }> = [
  { label: "Em andamento", value: "in_progress" },
  { label: "Concluída", value: "completed" },
  { label: "Pausada", value: "paused" },
];

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  in_progress: "Em andamento",
  completed: "Concluída",
  paused: "Pausada",
};

export const GOAL_PRIORITY_OPTIONS: Array<{ label: string; value: GoalPriority }> = [
  { label: "Baixa", value: "low" },
  { label: "Média", value: "medium" },
  { label: "Alta", value: "high" },
];

export const GOAL_PRIORITY_LABELS: Record<GoalPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string[];
}> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/transacoes",
    label: "Transações",
    icon: ReceiptText,
  },
  {
    href: "/cartoes",
    label: "Cartões",
    icon: WalletCards,
  },
  {
    href: "/metas",
    label: "Metas",
    icon: Target,
  },
  {
    href: "/categorias",
    label: "Categorias",
    icon: Shapes,
  },
  {
    href: "/orcamentos",
    label: "Orçamentos",
    icon: PiggyBank,
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: ChartColumnIncreasing,
  },
];

import type { Tables } from "@/types/database";

export type TransactionType = "income" | "expense";
export type GoalStatus = "in_progress" | "completed" | "paused";
export type GoalPriority = "low" | "medium" | "high";

export type Profile = Tables<"profiles">;
export type Category = Tables<"categories">;
export type Transaction = Tables<"transactions">;
export type Budget = Tables<"budgets">;
export type CreditCard = Tables<"credit_cards">;
export type CreditCardPurchase = Tables<"credit_card_purchases">;
export type FinancialGoal = Tables<"financial_goals">;

export type TransactionWithCategory = Transaction & {
  category: Pick<Category, "id" | "name" | "type"> | null;
};

export type FinancialEntry = {
  id: string;
  source: "transaction" | "credit_card";
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category: Pick<Category, "id" | "name" | "type"> | null;
  sourceLabel?: string | null;
};

export type BudgetWithCategory = Budget & {
  category: Pick<Category, "id" | "name" | "type"> | null;
};

export type CreditCardPurchaseWithRelations = CreditCardPurchase & {
  card: Pick<CreditCard, "id" | "name" | "last_four" | "closing_day" | "due_day" | "limit_amount" | "color"> | null;
  category: Pick<Category, "id" | "name" | "type"> | null;
};

export type FinancialGoalWithCategory = FinancialGoal & {
  category: Pick<Category, "id" | "name" | "type"> | null;
};

export type FinancialGoalProgress = FinancialGoalWithCategory & {
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  deadlineTone: "safe" | "warning" | "danger";
  isNearDeadline: boolean;
  isOverdue: boolean;
  isAchieved: boolean;
};

export type FinancialGoalsSnapshot = {
  goals: FinancialGoalProgress[];
  summary: {
    totalGoals: number;
    completedGoals: number;
    plannedAmountTotal: number;
    currentAmountTotal: number;
    nearDeadlineCount: number;
    highPriorityCount: number;
  };
};

export type CreditCardMonthlyCharge = {
  purchaseId: string;
  cardId: string;
  categoryId: string;
  cardName: string;
  cardLastFour: string | null;
  cardColor: string;
  categoryName: string;
  description: string;
  amount: number;
  amountTotal: number;
  purchaseDate: string;
  chargeDate: string;
  installmentNumber: number | null;
  installmentsCount: number | null;
  isFixed: boolean;
};

export type CreditCardSnapshot = {
  month: number;
  year: number;
  cards: CreditCard[];
  purchases: CreditCardPurchaseWithRelations[];
  charges: CreditCardMonthlyCharge[];
  totalDue: number;
  activePurchasesCount: number;
  totalsByCard: Array<{
    cardId: string;
    cardName: string;
    cardLastFour: string | null;
    cardColor: string;
    limitAmount: number;
    totalDue: number;
    usagePercentage: number;
  }>;
};

export type CategorySummaryItem = {
  categoryId: string;
  categoryName: string;
  total: number;
  type: TransactionType;
  percentage: number;
};

export type DashboardSnapshot = {
  userName: string;
  balance: number;
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
  previousNetTotal: number;
  savingsRate: number;
  recentTransactions: FinancialEntry[];
  incomeVsExpense: Array<{
    label: string;
    income: number;
    expense: number;
  }>;
  categoryBreakdown: CategorySummaryItem[];
  budgetUsage: Array<{
    budgetId: string;
    categoryId: string;
    categoryName: string;
    limitAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentage: number;
    status: "safe" | "warning" | "danger";
  }>;
};

export type TransactionFilters = {
  query?: string;
  type?: TransactionType;
  categoryId?: string;
  from?: string;
  to?: string;
  sortBy?: "transaction_date" | "amount";
  sortOrder?: "asc" | "desc";
};

export type ReportFilters = {
  from: string;
  to: string;
  type?: TransactionType;
  categoryId?: string;
};

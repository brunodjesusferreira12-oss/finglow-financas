import { getBillingMonthDiff } from "@/lib/credit-card";
import { calculatePercentage, safeNumber } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CreditCard,
  CreditCardMonthlyCharge,
  CreditCardPurchaseWithRelations,
  CreditCardSnapshot,
  FinancialEntry,
} from "@/types/finance";

type RawCreditCardPurchase = CreditCardPurchaseWithRelations;

function getMonthDiff(purchase: CreditCardPurchaseWithRelations, month: number, year: number) {
  return getBillingMonthDiff(purchase.purchase_date, purchase.card?.closing_day, month, year);
}

function getInstallmentAmount(amountTotal: number, installmentsCount: number, installmentNumber: number) {
  const totalCents = Math.round(amountTotal * 100);
  const baseCents = Math.floor(totalCents / installmentsCount);
  const remainder = totalCents - baseCents * installmentsCount;
  const cents = baseCents + (installmentNumber <= remainder ? 1 : 0);

  return cents / 100;
}

function getChargeDate(purchase: CreditCardPurchaseWithRelations, month: number, year: number) {
  const dueDay = purchase.card?.due_day ?? purchase.card?.closing_day ?? 31;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const resolvedDay = Math.min(dueDay, lastDayOfMonth);

  return `${year}-${String(month).padStart(2, "0")}-${String(resolvedDay).padStart(2, "0")}`;
}

function toMonthlyCharge(
  purchase: CreditCardPurchaseWithRelations,
  month: number,
  year: number,
): CreditCardMonthlyCharge | null {
  const diff = getMonthDiff(purchase, month, year);

  if (diff < 0) return null;

  if (purchase.is_fixed) {
    return {
      purchaseId: purchase.id,
      cardId: purchase.card_id,
      categoryId: purchase.category_id,
      cardName: purchase.card?.name ?? "Cartao",
      cardLastFour: purchase.card?.last_four ?? null,
      cardColor: purchase.card?.color ?? "#0f766e",
      categoryName: purchase.category?.name ?? "Sem categoria",
      description: purchase.description,
      amount: safeNumber(purchase.amount_total),
      amountTotal: safeNumber(purchase.amount_total),
      purchaseDate: purchase.purchase_date,
      chargeDate: getChargeDate(purchase, month, year),
      installmentNumber: null,
      installmentsCount: null,
      isFixed: true,
    };
  }

  const installmentNumber = diff + 1;

  if (installmentNumber > purchase.installments_count) return null;

  return {
    purchaseId: purchase.id,
    cardId: purchase.card_id,
    categoryId: purchase.category_id,
    cardName: purchase.card?.name ?? "Cartao",
    cardLastFour: purchase.card?.last_four ?? null,
    cardColor: purchase.card?.color ?? "#0f766e",
    categoryName: purchase.category?.name ?? "Sem categoria",
    description: purchase.description,
    amount: getInstallmentAmount(safeNumber(purchase.amount_total), purchase.installments_count, installmentNumber),
    amountTotal: safeNumber(purchase.amount_total),
    purchaseDate: purchase.purchase_date,
    chargeDate: getChargeDate(purchase, month, year),
    installmentNumber,
    installmentsCount: purchase.installments_count,
    isFixed: false,
  };
}

function getRangeBoundary(purchases: CreditCardPurchaseWithRelations[], boundary?: string, fallbackToCurrent = false) {
  if (boundary) {
    return new Date(`${boundary}T00:00:00`);
  }

  if (purchases.length === 0) {
    return new Date();
  }

  if (fallbackToCurrent) {
    return new Date();
  }

  return new Date(
    `${purchases.reduce((earliest, purchase) => (purchase.purchase_date < earliest ? purchase.purchase_date : earliest), purchases[0].purchase_date)}T00:00:00`,
  );
}

function isWithinRange(date: string, from?: string, to?: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function toChargeEntry(purchase: CreditCardPurchaseWithRelations, charge: CreditCardMonthlyCharge): FinancialEntry {
  const installmentLabel = charge.isFixed
    ? "Compra fixa mensal"
    : `Parcela ${charge.installmentNumber}/${charge.installmentsCount}`;
  const cardLabel = charge.cardLastFour ? `${charge.cardName} final ${charge.cardLastFour}` : charge.cardName;

  return {
    id: `${purchase.id}:${charge.chargeDate}:${charge.installmentNumber ?? "fixed"}`,
    source: "credit_card",
    user_id: purchase.user_id,
    category_id: purchase.category_id,
    description: charge.description,
    amount: charge.amount,
    type: "expense",
    transaction_date: charge.chargeDate,
    notes: `${installmentLabel} • ${cardLabel}`,
    created_at: purchase.created_at,
    updated_at: purchase.updated_at,
    category: purchase.category,
    sourceLabel: `Cartao ${cardLabel}`,
  };
}

export async function listCreditCards(userId: string): Promise<CreditCard[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("credit_cards").select("*").eq("user_id", userId).order("updated_at", { ascending: false });

  return (data as CreditCard[] | null) ?? [];
}

export async function listCreditCardPurchases(userId: string): Promise<CreditCardPurchaseWithRelations[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("credit_card_purchases")
    .select(
      "id, user_id, card_id, category_id, description, amount_total, purchase_date, installments_count, is_fixed, notes, created_at, updated_at, card:credit_cards(id, name, last_four, closing_day, due_day, limit_amount, color), category:categories(id, name, type)",
    )
    .eq("user_id", userId)
    .order("purchase_date", { ascending: false });

  const purchases = (data as RawCreditCardPurchase[] | null) ?? [];

  return purchases.map((purchase) => ({
    ...purchase,
    amount_total: safeNumber(purchase.amount_total),
  }));
}

export async function listCreditCardChargeEntries(
  userId: string,
  from?: string,
  to?: string,
): Promise<FinancialEntry[]> {
  const purchases = await listCreditCardPurchases(userId);

  if (purchases.length === 0) {
    return [];
  }

  const startDate = getRangeBoundary(purchases, from);
  const endDate = getRangeBoundary(purchases, to, true);
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const finalMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const entries: FinancialEntry[] = [];

  while (cursor <= finalMonth) {
    const month = cursor.getMonth() + 1;
    const year = cursor.getFullYear();

    purchases.forEach((purchase) => {
      const charge = toMonthlyCharge(purchase, month, year);

      if (charge && isWithinRange(charge.chargeDate, from, to)) {
        entries.push(toChargeEntry(purchase, charge));
      }
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return entries.sort((left, right) => right.transaction_date.localeCompare(left.transaction_date));
}

export async function getCreditCardSnapshot(userId: string, month: number, year: number): Promise<CreditCardSnapshot> {
  const [cards, purchases] = await Promise.all([listCreditCards(userId), listCreditCardPurchases(userId)]);
  const charges = purchases
    .map((purchase) => toMonthlyCharge(purchase, month, year))
    .filter((charge): charge is CreditCardMonthlyCharge => Boolean(charge));

  const totalDue = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const totalsByCard = cards.map((card) => {
    const cardTotal = charges.filter((charge) => charge.cardId === card.id).reduce((sum, charge) => sum + charge.amount, 0);

    return {
      cardId: card.id,
      cardName: card.name,
      cardLastFour: card.last_four,
      cardColor: card.color,
      limitAmount: safeNumber(card.limit_amount),
      totalDue: cardTotal,
      usagePercentage: calculatePercentage(cardTotal, safeNumber(card.limit_amount)),
    };
  });

  return {
    month,
    year,
    cards,
    purchases,
    charges,
    totalDue,
    activePurchasesCount: purchases.filter((purchase) => purchase.is_fixed || toMonthlyCharge(purchase, month, year)).length,
    totalsByCard,
  };
}

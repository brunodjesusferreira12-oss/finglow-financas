import { CreditCard, ReceiptText, Repeat2, WalletCards } from "lucide-react";

import { CreditCardForm } from "@/components/credit-cards/credit-card-form";
import { CreditCardInvoice } from "@/components/credit-cards/credit-card-invoice";
import { CreditCardList } from "@/components/credit-cards/credit-card-list";
import { CreditCardPeriodFilter } from "@/components/credit-cards/credit-card-period-filter";
import { CreditCardPurchaseForm } from "@/components/credit-cards/credit-card-purchase-form";
import { CreditCardPurchasesList } from "@/components/credit-cards/credit-card-purchases-list";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireUser } from "@/lib/auth";
import { MONTH_NAMES } from "@/lib/constants";
import { getCurrentMonthYear } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { getSingleParam } from "@/lib/utils";
import { getCategories } from "@/services/category-service";
import { getCreditCardSnapshot } from "@/services/credit-card-service";
import type { Category } from "@/types/finance";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CreditCardsPage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const currentPeriod = getCurrentMonthYear();
  const month = Number(getSingleParam(params.month) ?? currentPeriod.month);
  const year = Number(getSingleParam(params.year) ?? currentPeriod.year);
  const editCardId = getSingleParam(params.editCard);
  const editPurchaseId = getSingleParam(params.editPurchase);

  let categories: Category[] = [];
  let categoriesError: string | null = null;
  const snapshot = await getCreditCardSnapshot(user.id, month, year);

  try {
    categories = (await getCategories(user.id, "expense")) as Category[];
  } catch (error) {
    categoriesError = error instanceof Error ? error.message : "Não foi possível carregar as categorias para compras no cartão.";
  }

  const editingCard = snapshot.cards.find((card) => card.id === editCardId) ?? null;
  const editingPurchase = snapshot.purchases.find((purchase) => purchase.id === editPurchaseId) ?? null;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Cartões de crédito"
        description={`Controle faturas, compras parceladas e gastos fixos de ${MONTH_NAMES[month - 1]} de ${year}.`}
      />

      {categoriesError ? (
        <InlineNotice
          tone="warning"
          title="Categorias de despesa indisponíveis"
          description={categoriesError}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Fatura do mês"
          value={formatCurrency(snapshot.totalDue)}
          description="Parcelas e compras fixas previstas no período"
          icon={ReceiptText}
          tone={snapshot.totalDue > 0 ? "danger" : "neutral"}
        />
        <KpiCard
          label="Cartões cadastrados"
          value={String(snapshot.cards.length)}
          description="Cartões ativos para organizar suas faturas"
          icon={WalletCards}
          tone="neutral"
        />
        <KpiCard
          label="Compras ativas"
          value={String(snapshot.activePurchasesCount)}
          description="Parceladas em andamento e fixas mensais"
          icon={Repeat2}
          tone="success"
        />
      </section>

      <CreditCardPeriodFilter month={month} year={year} />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <CreditCardForm key={editingCard?.id ?? "new-card"} initialData={editingCard} />
        {snapshot.cards.length > 0 ? (
          <CreditCardList cards={snapshot.cards} />
        ) : (
          <EmptyState
            icon={CreditCard}
            title="Nenhum cartão cadastrado"
            description="Cadastre seu primeiro cartão para registrar compras parceladas e fixas."
          />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <CreditCardPurchaseForm
          key={editingPurchase?.id ?? "new-purchase"}
          cards={snapshot.cards}
          categories={categories}
          initialData={editingPurchase}
        />
        <CreditCardInvoice snapshot={snapshot} />
      </div>

      <CreditCardPurchasesList purchases={snapshot.purchases} month={month} year={year} />
    </div>
  );
}

export function getBillingStartDate(purchaseDate: string, closingDay?: number | null) {
  const resolvedClosingDay = closingDay ?? 31;
  const date = new Date(`${purchaseDate}T00:00:00`);
  const billingMonthOffset = date.getDate() > resolvedClosingDay ? 2 : 1;

  return new Date(date.getFullYear(), date.getMonth() + billingMonthOffset, 1);
}

export function getBillingMonthDiff(
  purchaseDate: string,
  closingDay: number | null | undefined,
  month: number,
  year: number,
) {
  const billingStartDate = getBillingStartDate(purchaseDate, closingDay);
  const startMonth = billingStartDate.getMonth() + 1;
  const startYear = billingStartDate.getFullYear();

  return (year - startYear) * 12 + (month - startMonth);
}

export function getPaidInstallmentsCount(
  purchaseDate: string,
  closingDay: number | null | undefined,
  installmentsCount: number,
  month: number,
  year: number,
) {
  const diff = getBillingMonthDiff(purchaseDate, closingDay, month, year);

  return Math.max(0, Math.min(installmentsCount, diff + 1));
}

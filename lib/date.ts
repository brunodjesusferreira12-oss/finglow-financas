const DEFAULT_APP_TIME_ZONE = "America/Fortaleza";

function getNumericDatePart(date: Date, type: "month" | "year", timeZone: string) {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone,
    [type]: "numeric",
  })
    .formatToParts(date)
    .find((part) => part.type === type)?.value;

  return Number(value);
}

export function getCurrentMonthYear(timeZone = DEFAULT_APP_TIME_ZONE) {
  const now = new Date();
  const month = getNumericDatePart(now, "month", timeZone);
  const year = getNumericDatePart(now, "year", timeZone);

  return {
    month: month || now.getMonth() + 1,
    year: year || now.getFullYear(),
  };
}

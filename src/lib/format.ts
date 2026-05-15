const EN_LATN = "en-US-u-nu-latn";

/** Western numerals only (pair with {@link TomanAmount} / {@link TomanIcon}). */
export function formatMoneyAmount(value: number): string {
  return new Intl.NumberFormat(EN_LATN, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

/** Gregorian calendar (locale default). */
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

/** Jalali (Persian) calendar with **English** month names; Western numerals. */
export function formatDatePersian(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return formatDate(iso);
  }
}

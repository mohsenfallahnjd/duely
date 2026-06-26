import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

export type CalendarType = "gregorian" | "jalali";

export const GREGORIAN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const JALALI_MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];

export function toJalali(gYear: number, gMonth: number, gDay = 15) {
  const d = new DateObject({ year: gYear, month: gMonth, day: gDay, calendar: gregorian, locale: gregorian_en });
  d.convert(persian, persian_fa);
  return { year: d.year as unknown as number, month: d.month as unknown as number, day: d.day as unknown as number, monthName: JALALI_MONTHS[(d.month as unknown as number) - 1] };
}

export function fromJalali(jYear: number, jMonth: number, jDay = 1) {
  const d = new DateObject({ year: jYear, month: jMonth, day: jDay, calendar: persian, locale: persian_fa });
  d.convert(gregorian, gregorian_en);
  return { year: d.year as unknown as number, month: d.month as unknown as number, day: d.day as unknown as number };
}

// Installment row label — uses actual due day to pick correct Jalali month
export function getInstallmentLabel(gYear: number, gMonth: number, dueDay: number, cal: CalendarType): string {
  if (cal === "jalali") {
    const safeDay = Math.min(dueDay, 28);
    const j = toJalali(gYear, gMonth, safeDay);
    return `${j.monthName} ${j.year}`;
  }
  return `${GREGORIAN_MONTHS[gMonth - 1]} ${gYear}`;
}

// Month header label for calendar navigation
export function getMonthLabel(gYear: number, gMonth: number, cal: CalendarType) {
  if (cal === "jalali") {
    const j = toJalali(gYear, gMonth, 1);
    return `${j.monthName} ${j.year}`;
  }
  return `${GREGORIAN_MONTHS[gMonth - 1]} ${gYear}`;
}

export function isCurrentMonth(gYear: number, gMonth: number, cal: CalendarType) {
  const now = new Date();
  if (cal === "jalali") {
    const cur = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const disp = toJalali(gYear, gMonth, 1);
    return cur.year === disp.year && cur.month === disp.month;
  }
  return gYear === now.getFullYear() && gMonth === now.getMonth() + 1;
}

export function formatDueDay(day: number, cal: CalendarType) {
  if (cal === "jalali") return `هر ماه روز ${day}`;
  const s = ["th","st","nd","rd"];
  const v = day % 100;
  return `Due ${day}${s[(v - 20) % 10] ?? s[v] ?? s[0]} of each month`;
}

// --- Calendar grid helpers ---

export function isJalaliLeap(year: number): boolean {
  const remainders = [1, 5, 9, 13, 17, 22, 26, 30];
  return remainders.includes(((year - (year > 474 ? 474 : 473)) % 2820 + 474) % 33);
}

export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeap(year) ? 30 : 29;
}

export function getDaysInGregorianMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Empty cells before day 1 in calendar grid
// Jalali week starts Saturday (JS day 6), Gregorian week starts Sunday (JS day 0)
export function getMonthStartOffset(year: number, month: number, cal: CalendarType): number {
  let gYear = year, gMonth = month, gDay = 1;
  if (cal === "jalali") {
    const g = fromJalali(year, month, 1);
    gYear = g.year; gMonth = g.month; gDay = g.day;
  }
  const weekday = new Date(gYear, gMonth - 1, gDay).getDay();
  if (cal === "jalali") return (weekday - 6 + 7) % 7;
  return weekday;
}

export const JALALI_WEEK_DAYS = ["ش","ی","د","س","چ","پ","ج"];
export const GREGORIAN_WEEK_DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

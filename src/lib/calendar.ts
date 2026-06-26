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

export function getMonthLabel(gYear: number, gMonth: number, cal: CalendarType) {
  if (cal === "jalali") {
    const j = toJalali(gYear, gMonth);
    return `${j.monthName} ${j.year}`;
  }
  return `${GREGORIAN_MONTHS[gMonth - 1]} ${gYear}`;
}

export function isCurrentMonth(gYear: number, gMonth: number, cal: CalendarType) {
  const now = new Date();
  if (cal === "jalali") {
    const cur = toJalali(now.getFullYear(), now.getMonth() + 1);
    const disp = toJalali(gYear, gMonth);
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

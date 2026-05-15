"use client";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";
import DateObject from "react-date-object";
import { cn } from "@/lib/cn";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100";

type Props = {
  /** Gregorian instant as ISO string */
  valueIso: string;
  onChange: (isoGregorian: string) => void;
  className?: string;
};

export function PersianDateField({ valueIso, onChange, className }: Props) {
  const d = new Date(valueIso);
  const value = Number.isNaN(d.getTime()) ? new Date() : d;

  function handleChange(
    date: DateObject | DateObject[] | null | undefined,
  ) {
    if (!date || Array.isArray(date)) return;
    const js = date.toDate?.();
    if (!js || Number.isNaN(js.getTime())) return;
    onChange(js.toISOString());
  }

  return (
    <div className={cn("paymay-jalali-picker w-full", className)}>
      <DatePicker
        calendar={persian}
        locale={persian_en}
        value={value}
        onChange={handleChange}
        format="YYYY/MM/DD"
        calendarPosition="bottom-right"
        inputClass={inputClass}
        containerClassName="w-full"
        editable={false}
      />
    </div>
  );
}

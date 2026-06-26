"use client";

import { X } from "lucide-react";
import { useCalendar } from "./calendar-context";
import type { CalendarType } from "@/lib/calendar";
import type { Lang } from "./calendar-context";
import { cn } from "@/lib/cn";

const CURRENCIES = ["USD", "EUR", "GBP", "IRR", "AED", "CAD", "AUD", "TRY", "CNY", "JPY"];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { cal, setCal, lang, setLang, currency, setCurrency } = useCalendar();
  const fa = lang === "fa";

  const calOptions: { value: CalendarType; label: string; sub: string }[] = [
    { value: "gregorian", label: fa ? "میلادی" : "Gregorian", sub: "Jan · Feb · Mar …" },
    { value: "jalali",    label: fa ? "شمسی" : "Jalali (Shamsi)", sub: "فروردین · اردیبهشت · خرداد …" },
  ];

  const langOptions: { value: Lang; label: string; sub: string }[] = [
    { value: "en", label: "English", sub: "Interface in English" },
    { value: "fa", label: "فارسی",   sub: "رابط کاربری به فارسی" },
  ];

  const btnBase = "w-full flex items-center justify-between rounded-2xl border px-4 py-3 transition text-left";
  const btnActive = "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white";
  const btnInactive = "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500";
  const txtActive = "font-medium text-sm text-white dark:text-zinc-900";
  const txtInactive = "font-medium text-sm text-zinc-900 dark:text-white";
  const subActive = "text-xs mt-0.5 text-zinc-300 dark:text-zinc-600";
  const subInactive = "text-xs mt-0.5 text-zinc-400 dark:text-zinc-500";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col sheet-enter" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <h2 className="font-semibold text-zinc-900 dark:text-white">{fa ? "تنظیمات" : "Settings"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
        <div className="p-6 space-y-6">
          {/* Language */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
              {fa ? "زبان" : "Language"}
            </p>
            <div className="space-y-2">
              {langOptions.map(opt => (
                <button key={opt.value} onClick={() => setLang(opt.value)} className={cn(btnBase, lang === opt.value ? btnActive : btnInactive)}>
                  <div>
                    <div className={lang === opt.value ? txtActive : txtInactive}>{opt.label}</div>
                    <div className={lang === opt.value ? subActive : subInactive}>{opt.sub}</div>
                  </div>
                  {lang === opt.value && <div className="w-2 h-2 rounded-full bg-white dark:bg-zinc-900 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
              {fa ? "تقویم" : "Calendar"}
            </p>
            <div className="space-y-2">
              {calOptions.map(opt => (
                <button key={opt.value} onClick={() => setCal(opt.value)} className={cn(btnBase, cal === opt.value ? btnActive : btnInactive)}>
                  <div>
                    <div className={cal === opt.value ? txtActive : txtInactive}>{opt.label}</div>
                    <div className={cal === opt.value ? subActive : subInactive}>{opt.sub}</div>
                  </div>
                  {cal === opt.value && <div className="w-2 h-2 rounded-full bg-white dark:bg-zinc-900 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
              {fa ? "ارز پیش‌فرض" : "Default currency"}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {CURRENCIES.map(c => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={cn(
                    "rounded-xl border py-2 text-xs font-medium transition",
                    currency === c
                      ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500",
                  )}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { ThemeToggle } from "./theme-toggle";
import {
  toJalali, fromJalali,
  JALALI_MONTHS, GREGORIAN_MONTHS,
  getDaysInJalaliMonth, getDaysInGregorianMonth,
  getMonthStartOffset, JALALI_WEEK_DAYS, GREGORIAN_WEEK_DAYS,
} from "@/lib/calendar";

type Loan = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  dueDay: number;
  paymentUrl: string | null;
  installments: number | null;
  startYear: number;
  startMonth: number;
};

type Payment = {
  id: string;
  loanId: string;
  year: number;
  month: number;
  paid: boolean;
  paidAt: Date | null;
};

export function CalendarView(props: { loans: Loan[]; allPayments: Payment[] }) {
  return (
    <CalendarProvider>
      <CalendarInner {...props} />
    </CalendarProvider>
  );
}

function CalendarInner({ loans, allPayments: initialPayments }: { loans: Loan[]; allPayments: Payment[] }) {
  const { cal, lang } = useCalendar();
  const fa = lang === "fa";
  const now = new Date();

  // Track display in native calendar coordinates
  const initYear = cal === "jalali"
    ? toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate()).year
    : now.getFullYear();
  const initMonth = cal === "jalali"
    ? toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate()).month
    : now.getMonth() + 1;

  const [dispYear, setDispYear] = useState(initYear);
  const [dispMonth, setDispMonth] = useState(initMonth);
  const [allPayments, setAllPayments] = useState<Payment[]>(initialPayments);

  // Reset to current month when calendar type changes
  useEffect(() => {
    if (cal === "jalali") {
      const j = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      setDispYear(j.year); setDispMonth(j.month);
    } else {
      setDispYear(now.getFullYear()); setDispMonth(now.getMonth() + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cal]);

  function prevMonth() {
    if (dispMonth === 1) { setDispMonth(12); setDispYear(y => y - 1); }
    else setDispMonth(m => m - 1);
  }
  function nextMonth() {
    const last = cal === "jalali" ? 12 : 12;
    if (dispMonth === last) { setDispMonth(1); setDispYear(y => y + 1); }
    else setDispMonth(m => m + 1);
  }

  const monthLabel = cal === "jalali"
    ? `${JALALI_MONTHS[dispMonth - 1]} ${dispYear}`
    : `${GREGORIAN_MONTHS[dispMonth - 1]} ${dispYear}`;

  const numDays = cal === "jalali"
    ? getDaysInJalaliMonth(dispYear, dispMonth)
    : getDaysInGregorianMonth(dispYear, dispMonth);

  const offset = getMonthStartOffset(dispYear, dispMonth, cal);
  const weekDays = cal === "jalali" ? JALALI_WEEK_DAYS : GREGORIAN_WEEK_DAYS;

  // Convert a display-calendar day to Gregorian
  function toGregorian(day: number): { gYear: number; gMonth: number; gDay: number } {
    if (cal === "jalali") {
      const g = fromJalali(dispYear, dispMonth, day);
      return { gYear: g.year, gMonth: g.month, gDay: g.day };
    }
    return { gYear: dispYear, gMonth: dispMonth, gDay: day };
  }

  // Check if a loan is active for a given Gregorian month
  function loanActiveForGMonth(loan: Loan, gYear: number, gMonth: number): boolean {
    const startTotal = loan.startYear * 12 + loan.startMonth - 1;
    const curTotal = gYear * 12 + gMonth - 1;
    if (curTotal < startTotal) return false;
    if (loan.installments) {
      const endTotal = startTotal + loan.installments - 1;
      if (curTotal > endTotal) return false;
    }
    return true;
  }

  // Loans due on a specific day (checking Gregorian)
  function loansDueOnDay(day: number): Array<{ loan: Loan; paid: boolean }> {
    const { gYear, gMonth, gDay } = toGregorian(day);
    return loans
      .filter(l => l.dueDay === gDay && loanActiveForGMonth(l, gYear, gMonth))
      .map(l => {
        const payment = allPayments.find(
          p => p.loanId === l.id && p.year === gYear && p.month === gMonth
        );
        return { loan: l, paid: payment?.paid ?? false };
      });
  }

  // Loans visible this displayed month (for list below)
  const visibleLoans = loans.filter(l => {
    // At least one day of the displayed month must be active for this loan
    const { gYear, gMonth } = toGregorian(15); // midpoint day for month check
    return loanActiveForGMonth(l, gYear, gMonth);
  });

  // Today's day number in current calendar
  const todayDispDay = (() => {
    if (cal === "jalali") {
      const j = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return j.year === dispYear && j.month === dispMonth ? j.day : null;
    }
    return now.getFullYear() === dispYear && now.getMonth() + 1 === dispMonth
      ? now.getDate() : null;
  })();

  const totalCells = offset + numDays;
  const rows = Math.ceil(totalCells / 7);

  return (
    <div className={`min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 ${fa ? "font-[vazirmatn,sans-serif]" : ""}`} dir={fa ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-semibold text-zinc-900 dark:text-white flex-1 text-center">
            {fa ? "تقویم" : "Calendar"}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-lg text-zinc-900 dark:text-white">{monthLabel}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
            {weekDays.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: rows * 7 }, (_, i) => {
              const day = i - offset + 1;
              const isValid = day >= 1 && day <= numDays;
              if (!isValid) return <div key={i} className="h-14" />;

              const dueLoanInfos = loansDueOnDay(day);
              const isToday = day === todayDispDay;

              return (
                <div key={i} className={cn(
                  "h-14 flex flex-col items-center pt-2 gap-0.5 border-t border-zinc-50 dark:border-zinc-800/50",
                  isToday && "bg-zinc-50 dark:bg-zinc-800/40",
                )}>
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm",
                    isToday
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold"
                      : "text-zinc-700 dark:text-zinc-300",
                  )}>
                    {cal === "jalali" ? day.toLocaleString("fa-IR") : day}
                  </span>
                  {dueLoanInfos.length > 0 && (
                    <div className="flex gap-0.5">
                      {dueLoanInfos.slice(0, 3).map(({ loan, paid }) => (
                        <div key={loan.id} className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          paid ? "bg-zinc-400 dark:bg-zinc-500" : "bg-zinc-900 dark:bg-white",
                        )} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* This month's loans list */}
        {visibleLoans.length > 0 && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
              {fa ? "سررسیدهای این ماه" : "Due this month"}
            </h3>
            <div className="flex flex-col gap-2">
              {visibleLoans.map(l => {
                const { gYear, gMonth } = toGregorian(l.dueDay > numDays ? numDays : l.dueDay);
                const payment = allPayments.find(p => p.loanId === l.id && p.year === gYear && p.month === gMonth);
                const paid = payment?.paid ?? false;
                return (
                  <div key={l.id} className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                    paid && "opacity-55",
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      paid ? "bg-zinc-300 dark:bg-zinc-600" : "bg-zinc-900 dark:bg-white",
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium", paid && "line-through text-zinc-400 dark:text-zinc-500")}>
                        {l.name}
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">
                        {fa ? `روز ${l.dueDay}` : `Day ${l.dueDay}`} · {l.amount.toLocaleString()} {l.currency}
                      </div>
                    </div>
                    {paid && <span className="text-xs text-zinc-400">{fa ? "پرداخت شد" : "Paid"}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {visibleLoans.length === 0 && (
          <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
            {fa ? "هیچ سررسیدی در این ماه وجود ندارد" : "No payments due this month"}
          </div>
        )}
      </main>
    </div>
  );
}

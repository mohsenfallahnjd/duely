"use client";

import { useState } from "react";
import { ArrowLeft, Check, ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { EditLoanModal } from "./edit-loan-modal";
import { toJalali, fromJalali, JALALI_MONTHS, GREGORIAN_MONTHS, getInstallmentLabel, formatDueDay, isCurrentMonth } from "@/lib/calendar";

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

function getLoanMonths(loan: Loan, now: Date): Array<{ year: number; month: number }> {
  const curTotal = now.getFullYear() * 12 + now.getMonth();
  const startTotal = loan.startYear * 12 + loan.startMonth - 1;
  const endTotal = loan.installments ? startTotal + loan.installments - 1 : curTotal + 3;
  const months: Array<{ year: number; month: number }> = [];
  for (let t = startTotal; t <= endTotal; t++) {
    months.push({ year: Math.floor(t / 12), month: (t % 12) + 1 });
  }
  return months;
}

export function LoanDetail({ loan, allPayments: initialPayments }: { loan: Loan; allPayments: Payment[] }) {
  return (
    <CalendarProvider>
      <LoanDetailInner loan={loan} initialPayments={initialPayments} />
    </CalendarProvider>
  );
}

function LoanDetailInner({ loan, initialPayments }: { loan: Loan; initialPayments: Payment[] }) {
  const { cal, lang } = useCalendar();
  const fa = lang === "fa";
  const now = new Date();
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [loanState, setLoanState] = useState(loan);

  const months = getLoanMonths(loanState, now);
  const curTotal = now.getFullYear() * 12 + now.getMonth();
  const paidCount = months.filter(({ year, month }) => payments.find(p => p.loanId === loanState.id && p.year === year && p.month === month)?.paid).length;
  const totalAmt = loanState.amount * months.length;
  const paidAmt = loanState.amount * paidCount;

  const todayDispDay = cal === "jalali"
    ? toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate()).day
    : now.getDate();

  async function togglePaid(year: number, month: number, paid: boolean) {
    const key = `${year}-${month}`;
    setToggling(key);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId: loanState.id, year, month, paid }),
    });
    if (res.ok) {
      const payment: Payment = await res.json();
      setPayments(prev => [
        ...prev.filter(p => !(p.loanId === loanState.id && p.year === year && p.month === month)),
        payment,
      ]);
    }
    setToggling(null);
  }

  return (
    <div className={`min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 ${fa ? "font-[family-name:var(--font-vazirmatn)]" : ""}`} dir={fa ? "rtl" : "ltr"}>
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="p-2 -ms-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition">
            <ArrowLeft className={cn("w-4 h-4", fa && "rotate-180")} />
          </Link>
          <span className="font-semibold text-zinc-900 dark:text-white truncate flex-1">{loanState.name}</span>
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* Summary card */}
        <div className="rounded-3xl bg-zinc-900 dark:bg-white p-5 text-white dark:text-zinc-900">
          <p className="text-sm font-semibold opacity-60 mb-1">{fa ? "جمع کل" : "Total amount"}</p>
          <p className="text-3xl font-bold tabular-nums">{totalAmt.toLocaleString()} <span className="text-lg opacity-60">{loanState.currency}</span></p>
          <div className="mt-3 flex gap-4 text-sm">
            <span className="opacity-75">{fa ? "پرداخت شده" : "Paid"}: {paidAmt.toLocaleString()}</span>
            <span className="opacity-75">{fa ? "باقی" : "Remaining"}: {(totalAmt - paidAmt).toLocaleString()}</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/20 dark:bg-zinc-900/20 overflow-hidden">
            <div className="h-full bg-white dark:bg-zinc-900 rounded-full" style={{ width: totalAmt > 0 ? `${(paidAmt / totalAmt) * 100}%` : "0%" }} />
          </div>
          <div className="mt-2 text-xs opacity-50">{fa ? `${paidCount} از ${months.length} قسط` : `${paidCount} of ${months.length} installments`}</div>
          <div className="mt-2 text-xs opacity-50">{formatDueDay(loanState.dueDay, cal, lang)}</div>
          {loanState.paymentUrl && (
            <a href={loanState.paymentUrl} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs bg-white/10 dark:bg-zinc-900/10 hover:bg-white/20 dark:hover:bg-zinc-900/20 px-3 py-1.5 rounded-lg transition">
              <ExternalLink className="w-3 h-3" />
              {fa ? "لینک پرداخت" : "Payment link"}
            </a>
          )}
        </div>

        {/* Installments */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {months.map(({ year, month }, idx) => {
            const payment = payments.find(p => p.loanId === loanState.id && p.year === year && p.month === month);
            const paid = payment?.paid ?? false;
            const key = `${year}-${month}`;
            const isLoading = toggling === key;
            const monthTotal = year * 12 + month - 1;
            const isCurrent = isCurrentMonth(year, month, cal as "gregorian" | "jalali");
            const isOverdue = isCurrent && !paid && todayDispDay > loanState.dueDay;
            const isFuture = monthTotal > curTotal;

            return (
              <div key={key} className={cn("flex items-center gap-3 px-4 py-3 transition", isCurrent && !paid && "bg-zinc-50 dark:bg-zinc-800/60", paid && "opacity-50")}>
                <button
                  onClick={() => void togglePaid(year, month, !paid)}
                  disabled={isLoading}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    paid ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
                      : isOverdue ? "border-red-400 hover:bg-red-50"
                      : isFuture ? "border-zinc-200 dark:border-zinc-700"
                      : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-900 dark:hover:border-white",
                  )}
                >
                  {isLoading ? (
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-t-white animate-spin" />
                  ) : paid ? (
                    <Check className="w-3.5 h-3.5 text-white dark:text-zinc-900" strokeWidth={3} />
                  ) : null}
                </button>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm",
                    paid && "line-through text-zinc-400 dark:text-zinc-500",
                    isCurrent && !paid && !isOverdue && "font-medium text-zinc-900 dark:text-white",
                    isOverdue && "text-red-500 dark:text-red-400 font-medium",
                    isFuture && "text-zinc-400 dark:text-zinc-500",
                  )}>
                    {getInstallmentLabel(year, month, loanState.dueDay, cal)}
                  </span>
                  {loanState.installments && (
                    <span className="ms-1.5 text-xs text-zinc-300 dark:text-zinc-600 tabular-nums">{idx + 1}/{loanState.installments}</span>
                  )}
                </div>
                <span className="text-xs text-zinc-400 tabular-nums flex-shrink-0">
                  {paid && payment?.paidAt
                    ? new Date(payment.paidAt).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", { month: "short", day: "numeric" })
                    : loanState.amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {showEdit && (
        <EditLoanModal
          loan={loanState}
          onClose={() => setShowEdit(false)}
          onSave={async (_id, data) => {
            const res = await fetch(`/api/loans/${loanState.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (res.ok) {
              const updated = await res.json();
              setLoanState((prev: Loan) => ({ ...prev, ...updated }));
            }
            setShowEdit(false);
          }}
        />
      )}
    </div>
  );
}

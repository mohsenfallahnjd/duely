"use client";

import { useState, useEffect, useMemo } from "react";
import { LoanSection } from "./loan-section";
import { AddLoanModal } from "./add-loan-modal";
import { NotificationToggle } from "./notification-toggle";
import { ThemeToggle } from "./theme-toggle";
import { SettingsModal } from "./settings-modal";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { ToastProvider, useToast } from "./toast";
import { toJalali, JALALI_MONTHS, getInstallmentLabel, getMonthLabel } from "@/lib/calendar";
import { signOut } from "next-auth/react";
import { Plus, LogOut, Settings, CalendarDays, LayoutList, Rows3, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

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
  active: boolean;
};

type Payment = {
  id: string;
  loanId: string;
  year: number;
  month: number;
  paid: boolean;
  paidAt: Date | null;
};

export function Dashboard(props: { loans: Loan[]; allPayments: Payment[] }) {
  return (
    <CalendarProvider>
      <ToastProvider>
        <DashboardInner {...props} />
      </ToastProvider>
    </CalendarProvider>
  );
}

function DashboardInner({ loans: initialLoans, allPayments: initialPayments }: {
  loans: Loan[];
  allPayments: Payment[];
}) {
  const { cal, lang } = useCalendar();
  const fa = lang === "fa";
  const { toast } = useToast();
  const [loans, setLoans] = useState(initialLoans);
  const [allPayments, setAllPayments] = useState<Payment[]>(initialPayments);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<"by-loan" | "by-month">("by-loan");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  function getPayment(loanId: string, year: number, month: number): Payment | null {
    return allPayments.find(p => p.loanId === loanId && p.year === year && p.month === month) ?? null;
  }

  async function togglePaid(loanId: string, year: number, month: number, paid: boolean): Promise<Payment | null> {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId, year, month, paid }),
    });
    if (!res.ok) { toast(fa ? "خطا در ثبت پرداخت" : "Failed to update", "error"); return null; }
    const payment: Payment = await res.json();
    setAllPayments(prev => [
      ...prev.filter(p => !(p.loanId === loanId && p.year === year && p.month === month)),
      payment,
    ]);
    toast(paid ? (fa ? "پرداخت ثبت شد ✓" : "Marked paid ✓") : (fa ? "پرداخت لغو شد" : "Payment removed"));
    return payment;
  }

  async function addLoan(data: {
    name: string; amount: number; currency: string; dueDay: number;
    paymentUrl: string; installments: number | null; startYear: number; startMonth: number;
  }) {
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast(fa ? "خطا در افزودن وام" : "Failed to add loan", "error"); return; }
    const loan = await res.json();
    setLoans(prev => [...prev, loan]);
    setShowAdd(false);
    toast(fa ? "وام اضافه شد ✓" : "Loan added ✓");
  }

  async function deleteLoan(id: string) {
    const res = await fetch(`/api/loans/${id}`, { method: "DELETE" });
    setLoans(prev => prev.filter(l => l.id !== id));
    if (res.ok) toast(fa ? "وام حذف شد" : "Loan deleted");
  }

  async function updateLoan(id: string, data: Partial<Loan>) {
    const res = await fetch(`/api/loans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast(fa ? "خطا در ذخیره" : "Failed to save", "error"); return; }
    const updated = await res.json();
    setLoans(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
    toast(fa ? "ذخیره شد ✓" : "Saved ✓");
  }

  // Today display
  const todayLabel = (() => {
    if (cal === "jalali") {
      const j = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return fa
        ? `${j.day} ${JALALI_MONTHS[j.month - 1]} ${j.year}`
        : `${JALALI_MONTHS[j.month - 1]} ${j.day}, ${j.year}`;
    }
    return now.toLocaleDateString(fa ? "fa-IR" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  })();

  const timeLabel = now.toLocaleTimeString(fa ? "fa-IR" : "en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  // All unique months across all loans (sorted) for by-month view
  const allMonths = useMemo(() => {
    const curTotal = now.getFullYear() * 12 + now.getMonth();
    const monthSet = new Map<string, { year: number; month: number }>();
    for (const loan of loans) {
      const startTotal = loan.startYear * 12 + loan.startMonth - 1;
      const endTotal = loan.installments ? startTotal + loan.installments - 1 : curTotal + 3;
      for (let t = startTotal; t <= endTotal; t++) {
        const y = Math.floor(t / 12);
        const m = (t % 12) + 1;
        monthSet.set(`${y}-${m}`, { year: y, month: m });
      }
    }
    return [...monthSet.values()].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }, [loans, now]);

  return (
    <div className={`min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 ${fa ? "font-[family-name:var(--font-vazirmatn)]" : ""}`} dir={fa ? "rtl" : "ltr"}>
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 text-sm font-bold">D</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">Duely</span>
          </div>

          <div className="flex-1 text-center text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            <span>{todayLabel}</span>
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">·</span>
            <span>{timeLabel}</span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <NotificationToggle />
            <Link href="/calendar" className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition">
              <CalendarDays className="w-4 h-4" />
            </Link>
            <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition">
              <Settings className="w-4 h-4" />
            </button>
            <ThemeToggle />
            <button onClick={() => void signOut({ callbackUrl: "/login" })} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4 flex-1">
        {loans.length > 0 && (
          /* View toggle */
          <div className="flex items-center gap-1 self-end bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("by-loan")}
              title={fa ? "نمای وام" : "By loan"}
              className={cn("p-1.5 rounded-lg transition", viewMode === "by-loan" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300")}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("by-month")}
              title={fa ? "نمای ماهانه" : "By month"}
              className={cn("p-1.5 rounded-lg transition", viewMode === "by-month" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300")}
            >
              <Rows3 className="w-4 h-4" />
            </button>
          </div>
        )}

        {loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">{fa ? "وامی ثبت نشده" : "No loans yet"}</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">{fa ? "اولین وام خود را اضافه کنید" : "Add your first loan below"}</p>
          </div>
        ) : viewMode === "by-loan" ? (
          loans.map(loan => (
            <LoanSection
              key={loan.id}
              loan={loan}
              now={now}
              getPayment={getPayment}
              onToggle={togglePaid}
              onDelete={deleteLoan}
              onUpdate={updateLoan}
            />
          ))
        ) : (
          /* By-month view */
          <ByMonthView
            loans={loans}
            allMonths={allMonths}
            now={now}
            cal={cal}
            fa={fa}
            lang={lang}
            getPayment={getPayment}
            onToggle={togglePaid}
          />
        )}

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 py-4 text-zinc-500 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-white hover:text-zinc-900 dark:hover:text-white transition font-medium"
        >
          <Plus className="w-4 h-4" />
          {fa ? "افزودن وام" : "Add loan"}
        </button>
      </main>

      {showAdd && <AddLoanModal onClose={() => setShowAdd(false)} onAdd={addLoan} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function ByMonthView({ loans, allMonths, now, cal, fa, lang, getPayment, onToggle }: {
  loans: Loan[];
  allMonths: Array<{ year: number; month: number }>;
  now: Date;
  cal: string;
  fa: boolean;
  lang: string;
  getPayment: (loanId: string, year: number, month: number) => Payment | null;
  onToggle: (loanId: string, year: number, month: number, paid: boolean) => Promise<Payment | null>;
}) {
  const curTotal = now.getFullYear() * 12 + now.getMonth();
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleToggle(loanId: string, year: number, month: number, paid: boolean) {
    const key = `${loanId}-${year}-${month}`;
    setToggling(key);
    await onToggle(loanId, year, month, paid);
    setToggling(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {allMonths.map(({ year, month }) => {
        const monthTotal2 = year * 12 + month - 1;
        const isCurrent = monthTotal2 === curTotal;

        const monthLoans = loans.filter(l => {
          const startTotal = l.startYear * 12 + l.startMonth - 1;
          if (monthTotal2 < startTotal) return false;
          if (l.installments) {
            const endTotal = startTotal + l.installments - 1;
            if (monthTotal2 > endTotal) return false;
          }
          return true;
        });

        // Totals per currency
        const totals: Record<string, { total: number; paid: number }> = {};
        for (const l of monthLoans) {
          const p = getPayment(l.id, year, month);
          if (!totals[l.currency]) totals[l.currency] = { total: 0, paid: 0 };
          totals[l.currency].total += l.amount;
          if (p?.paid) totals[l.currency].paid += l.amount;
        }

        const monthLabel = getMonthLabel(year, month, cal as "gregorian" | "jalali");

        return (
          <div key={`${year}-${month}`}>
            {/* Month header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-zinc-900 dark:text-white ${fa ? "font-[family-name:var(--font-vazirmatn)]" : ""}`}>{monthLabel}</h3>
                {isCurrent && (
                  <span className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-2 py-0.5 rounded-full font-medium">
                    {fa ? "این ماه" : "Now"}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {Object.entries(totals).map(([cur, { total, paid }]) => {
                  const remaining = total - paid;
                  return (
                    <span key={cur} className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                      {remaining > 0
                        ? `${remaining.toLocaleString()} ${cur}`
                        : <span className="text-zinc-400 dark:text-zinc-600">{fa ? "پرداخت شد" : "all paid"}</span>
                      }
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Loans this month */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
              {monthLoans.map(loan => {
                const payment = getPayment(loan.id, year, month);
                const paid = payment?.paid ?? false;
                const key = `${loan.id}-${year}-${month}`;
                const isLoading = toggling === key;
                const isOverdue = isCurrent && !paid && now.getDate() > loan.dueDay;
                const isFuture = monthTotal2 > curTotal;

                return (
                  <div key={loan.id} className={cn(
                    "flex items-center gap-3 px-4 py-3 transition",
                    isCurrent && !paid && "bg-zinc-50 dark:bg-zinc-800/60",
                    paid && "opacity-55",
                  )}>
                    <button
                      onClick={() => void handleToggle(loan.id, year, month, !paid)}
                      disabled={isLoading}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition",
                        paid
                          ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
                          : isFuture
                            ? "border-zinc-200 dark:border-zinc-700"
                            : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-900 dark:hover:border-white",
                      )}
                    >
                      {isLoading ? (
                        <span className="w-2 h-2 rounded-full border border-zinc-400 border-t-zinc-900 dark:border-t-white animate-spin" />
                      ) : paid ? (
                        <Check className="w-3 h-3 text-white dark:text-zinc-900" strokeWidth={3} />
                      ) : null}
                    </button>

                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-sm",
                        paid && "line-through text-zinc-400 dark:text-zinc-500",
                        isOverdue && !paid && "text-red-500 dark:text-red-400",
                      )}>
                        {loan.name}
                      </span>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {loan.amount.toLocaleString()} {loan.currency}
                        {isOverdue && !paid && <span className="ml-1 text-red-400">{fa ? "· تاخیر" : "· overdue"}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {paid && payment?.paidAt && (
                        <span className="text-xs text-zinc-400 tabular-nums">
                          {new Date(payment.paidAt).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {loan.paymentUrl && !paid && (
                        <a href={loan.paymentUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition">
                          <ExternalLink className="w-3 h-3" />
                          {fa ? "پرداخت" : "Pay"}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Month total bar */}
            {Object.entries(totals).map(([cur, { total, paid }]) => (
              <div key={cur} className="mt-1.5 px-1 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all"
                    style={{ width: total > 0 ? `${(paid / total) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs text-zinc-400 tabular-nums flex-shrink-0">
                  {paid.toLocaleString()}/{total.toLocaleString()} {cur}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

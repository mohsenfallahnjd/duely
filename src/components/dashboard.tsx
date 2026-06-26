"use client";

import { useState } from "react";
import { LoanCard } from "./loan-card";
import { AddLoanModal } from "./add-loan-modal";
import { NotificationToggle } from "./notification-toggle";
import { ThemeToggle } from "./theme-toggle";
import { SettingsModal } from "./settings-modal";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { getMonthLabel, isCurrentMonth } from "@/lib/calendar";
import { signOut } from "next-auth/react";
import { ChevronLeft, ChevronRight, Plus, LogOut, Settings } from "lucide-react";

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
  payment: { id: string; paid: boolean; paidAt: Date | null } | null;
};

export function Dashboard(props: {
  loans: Loan[];
  currentYear: number;
  currentMonth: number;
}) {
  return (
    <CalendarProvider>
      <DashboardInner {...props} />
    </CalendarProvider>
  );
}

function DashboardInner({ loans: initialLoans, currentYear, currentMonth }: {
  loans: Loan[];
  currentYear: number;
  currentMonth: number;
}) {
  const { cal, lang } = useCalendar();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [loans, setLoans] = useState(initialLoans);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function togglePaid(loanId: string, paid: boolean) {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId, year, month, paid }),
    });
    if (!res.ok) return null;
    const payment = await res.json();
    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, payment } : l));
    return payment;
  }

  async function addLoan(data: { name: string; amount: number; currency: string; dueDay: number; paymentUrl: string; installments: number | null; startYear: number; startMonth: number }) {
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const loan = await res.json();
    setLoans(prev => [...prev, { ...loan, payment: null }]);
    setShowAdd(false);
  }

  async function deleteLoan(id: string) {
    await fetch(`/api/loans/${id}`, { method: "DELETE" });
    setLoans(prev => prev.filter(l => l.id !== id));
  }

  // filter by start date and installments end date
  const visibleLoans = loans.filter(l => {
    const startTotal = l.startYear * 12 + l.startMonth - 1;
    const curTotal = year * 12 + month - 1;
    if (curTotal < startTotal) return false;
    if (l.installments) {
      const endTotal = startTotal + l.installments - 1;
      if (curTotal > endTotal) return false;
    }
    return true;
  });
  const paidCount = visibleLoans.filter(l => l.payment?.paid).length;
  const isCurrent = isCurrentMonth(year, month, cal);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 text-sm font-bold">D</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">Duely</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationToggle />
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <ThemeToggle />
            <button
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6 flex-1">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className={`font-semibold text-lg text-zinc-900 dark:text-white ${lang === "fa" ? "font-[vazirmatn,sans-serif]" : ""}`}>
              {getMonthLabel(year, month, cal)}
            </div>
            {isCurrent && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {lang === "fa" ? "ماه جاری" : "This month"}
              </div>
            )}
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {visibleLoans.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: lang === "fa" ? "وام‌ها" : "Loans", value: visibleLoans.length },
              { label: lang === "fa" ? "پرداخت شده" : "Paid", value: paidCount },
              { label: lang === "fa" ? "باقی‌مانده" : "Remaining", value: visibleLoans.length - paidCount },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide mb-1">{label}</div>
                <div className="text-2xl font-semibold text-zinc-900 dark:text-white">{value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {visibleLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                {lang === "fa" ? "وامی ثبت نشده" : "No loans yet"}
              </p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                {lang === "fa" ? "اولین وام خود را اضافه کنید" : "Add your first loan to get started"}
              </p>
            </div>
          ) : (
            visibleLoans.map(loan => (
              <LoanCard
                key={loan.id}
                loan={loan}
                year={year}
                month={month}
                onToggle={togglePaid}
                onDelete={deleteLoan}
              />
            ))
          )}
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 py-4 text-zinc-500 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-white hover:text-zinc-900 dark:hover:text-white transition font-medium"
        >
          <Plus className="w-4 h-4" />
          {lang === "fa" ? "افزودن وام" : "Add loan"}
        </button>
      </main>

      {showAdd && <AddLoanModal onClose={() => setShowAdd(false)} onAdd={addLoan} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

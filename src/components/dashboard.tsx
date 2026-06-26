"use client";

import { useState, useEffect } from "react";
import { LoanSection } from "./loan-section";
import { AddLoanModal } from "./add-loan-modal";
import { NotificationToggle } from "./notification-toggle";
import { ThemeToggle } from "./theme-toggle";
import { SettingsModal } from "./settings-modal";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { toJalali, JALALI_MONTHS } from "@/lib/calendar";
import { signOut } from "next-auth/react";
import { Plus, LogOut, Settings, CalendarDays } from "lucide-react";
import Link from "next/link";

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
      <DashboardInner {...props} />
    </CalendarProvider>
  );
}

function DashboardInner({ loans: initialLoans, allPayments: initialPayments }: {
  loans: Loan[];
  allPayments: Payment[];
}) {
  const { cal, lang } = useCalendar();
  const fa = lang === "fa";
  const [loans, setLoans] = useState(initialLoans);
  const [allPayments, setAllPayments] = useState<Payment[]>(initialPayments);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
    if (!res.ok) return null;
    const payment: Payment = await res.json();
    setAllPayments(prev => [
      ...prev.filter(p => !(p.loanId === loanId && p.year === year && p.month === month)),
      payment,
    ]);
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
    if (!res.ok) return;
    const loan = await res.json();
    setLoans(prev => [...prev, loan]);
    setShowAdd(false);
  }

  async function deleteLoan(id: string) {
    await fetch(`/api/loans/${id}`, { method: "DELETE" });
    setLoans(prev => prev.filter(l => l.id !== id));
  }

  async function updateLoan(id: string, data: Partial<Loan>) {
    const res = await fetch(`/api/loans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setLoans(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
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

  return (
    <div className={`min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 ${fa ? "font-[vazirmatn,sans-serif]" : ""}`} dir={fa ? "rtl" : "ltr"}>
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 text-sm font-bold">D</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">Duely</span>
          </div>

          {/* Live date + time */}
          <div className="flex-1 text-center text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            <span>{todayLabel}</span>
            <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">·</span>
            <span>{timeLabel}</span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <NotificationToggle />
            <Link href="/calendar" className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition" title="Calendar">
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
        {loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">
              {fa ? "وامی ثبت نشده" : "No loans yet"}
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              {fa ? "اولین وام خود را اضافه کنید" : "Add your first loan below"}
            </p>
          </div>
        ) : (
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

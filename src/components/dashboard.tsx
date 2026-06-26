"use client";

import { useState, useTransition } from "react";
import { LoanCard } from "./loan-card";
import { AddLoanModal } from "./add-loan-modal";
import { NotificationToggle } from "./notification-toggle";
import { ThemeToggle } from "./theme-toggle";
import { signOut } from "next-auth/react";
import { ChevronLeft, ChevronRight, Plus, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";

type Loan = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  dueDay: number;
  paymentUrl: string | null;
  active: boolean;
  payment: { id: string; paid: boolean; paidAt: Date | null } | null;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function Dashboard({ loans: initialLoans, currentYear, currentMonth }: {
  loans: Loan[];
  currentYear: number;
  currentMonth: number;
}) {
  const now = new Date();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [loans, setLoans] = useState(initialLoans);
  const [showAdd, setShowAdd] = useState(false);
  const [, startTransition] = useTransition();

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

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
    if (!res.ok) return;
    const payment = await res.json();
    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, payment } : l));
  }

  async function addLoan(data: { name: string; amount: number; currency: string; dueDay: number; paymentUrl: string }) {
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

  const paidCount = loans.filter(l => l.payment?.paid).length;
  const totalAmount = loans.reduce((s, l) => s + l.amount, 0);
  const paidAmount = loans.filter(l => l.payment?.paid).reduce((s, l) => s + l.amount, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">Duely</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationToggle />
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
        {/* Month Navigator */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="font-semibold text-lg text-zinc-900 dark:text-white">
              {MONTHS[month - 1]} {year}
            </div>
            {isCurrentMonth && (
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">This month</div>
            )}
          </div>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        {loans.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide mb-1">Loans</div>
              <div className="text-2xl font-semibold text-zinc-900 dark:text-white">{loans.length}</div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide mb-1">Paid</div>
              <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{paidCount}</div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide mb-1">Remaining</div>
              <div className="text-2xl font-semibold text-zinc-900 dark:text-white">{loans.length - paidCount}</div>
            </div>
          </div>
        )}

        {/* Loan List */}
        <div className="flex flex-col gap-3">
          {loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">No loans yet</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Add your first loan to get started</p>
            </div>
          ) : (
            loans.map((loan) => (
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

        {/* Add Button */}
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 py-4 text-zinc-500 dark:text-zinc-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add loan
        </button>
      </main>

      {showAdd && (
        <AddLoanModal onClose={() => setShowAdd(false)} onAdd={addLoan} />
      )}
    </div>
  );
}

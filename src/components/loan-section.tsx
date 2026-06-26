"use client";

import { useState } from "react";
import { Check, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCalendar } from "./calendar-context";
import { getInstallmentLabel, formatDueDay } from "@/lib/calendar";
import { EditLoanModal } from "./edit-loan-modal";

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
  const curTotal = now.getFullYear() * 12 + now.getMonth(); // 0-based (Jan=0)
  const startTotal = loan.startYear * 12 + loan.startMonth - 1;
  const endTotal = loan.installments
    ? startTotal + loan.installments - 1
    : curTotal + 3;
  const months: Array<{ year: number; month: number }> = [];
  for (let t = startTotal; t <= endTotal; t++) {
    months.push({ year: Math.floor(t / 12), month: (t % 12) + 1 });
  }
  return months;
}

export function LoanSection({
  loan: initialLoan,
  now,
  getPayment,
  onToggle,
  onDelete,
  onUpdate,
}: {
  loan: Loan;
  now: Date;
  getPayment: (loanId: string, year: number, month: number) => Payment | null;
  onToggle: (loanId: string, year: number, month: number, paid: boolean) => Promise<Payment | null>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: Partial<Loan>) => Promise<void>;
}) {
  const { cal, lang } = useCalendar();
  const fa = lang === "fa";
  const [loan, setLoan] = useState(initialLoan);
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const months = getLoanMonths(loan, now);
  const curTotal = now.getFullYear() * 12 + now.getMonth();

  async function handleToggle(year: number, month: number, paid: boolean) {
    const key = `${year}-${month}`;
    setToggling(key);
    await onToggle(loan.id, year, month, paid);
    setToggling(null);
  }

  async function handleSave(id: string, data: Partial<Loan>) {
    await onUpdate(id, data);
    setLoan(prev => ({ ...prev, ...data }));
    setShowEdit(false);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Loan header */}
      <div className="flex items-start justify-between px-4 py-3.5 gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-zinc-900 dark:text-white truncate">{loan.name}</div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            {loan.amount.toLocaleString()} {loan.currency}
            {" · "}
            {formatDueDay(loan.dueDay, cal)}
            {loan.installments && ` · ${loan.installments} ${fa ? "قسط" : "installments"}`}
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">{fa ? "حذف؟" : "Delete?"}</span>
              <button onClick={() => void onDelete(loan.id)} className="text-red-500 font-medium hover:underline">
                {fa ? "بله" : "Yes"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-zinc-400 hover:underline">
                {fa ? "خیر" : "No"}
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setShowEdit(true)}
                className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white rounded-lg transition">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-red-500 rounded-lg transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Installment rows */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
        {months.map(({ year, month }) => {
          const payment = getPayment(loan.id, year, month);
          const paid = payment?.paid ?? false;
          const key = `${year}-${month}`;
          const isLoading = toggling === key;
          const monthTotal = year * 12 + month - 1; // 0-based
          const isCurrent = monthTotal === curTotal;
          const isOverdue = isCurrent && !paid && now.getDate() > loan.dueDay;
          const isFuture = monthTotal > curTotal;

          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 transition",
                isCurrent && !paid && "bg-zinc-50 dark:bg-zinc-800/60",
                paid && "opacity-55",
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => void handleToggle(year, month, !paid)}
                disabled={isLoading}
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition",
                  paid
                    ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
                    : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-900 dark:hover:border-white",
                )}
              >
                {isLoading ? (
                  <span className="w-2 h-2 rounded-full border border-zinc-400 border-t-zinc-900 dark:border-t-white animate-spin" />
                ) : paid ? (
                  <Check className="w-3 h-3 text-white dark:text-zinc-900" strokeWidth={3} />
                ) : null}
              </button>

              {/* Month label */}
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-sm",
                  paid && "line-through",
                  isCurrent && !paid && !isOverdue && "font-medium text-zinc-900 dark:text-white",
                  isOverdue && "text-red-500 dark:text-red-400 font-medium",
                  isFuture && "text-zinc-400 dark:text-zinc-500",
                )}>
                  {getInstallmentLabel(year, month, loan.dueDay, cal)}
                </span>
                {isOverdue && (
                  <span className="ml-1.5 text-xs text-red-400">{fa ? "· تاخیر" : "· overdue"}</span>
                )}
                {isCurrent && !paid && !isOverdue && (
                  <span className="ml-1.5 text-xs text-zinc-400">{fa ? "· این ماه" : "· this month"}</span>
                )}
              </div>

              {/* Right side */}
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

      {showEdit && (
        <EditLoanModal loan={loan} onClose={() => setShowEdit(false)} onSave={handleSave} />
      )}
    </div>
  );
}

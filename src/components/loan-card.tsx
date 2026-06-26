"use client";

import { useState } from "react";
import { ExternalLink, Trash2, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCalendar } from "./calendar-context";
import { formatDueDay } from "@/lib/calendar";
import { EditLoanModal } from "./edit-loan-modal";

type Loan = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  dueDay: number;
  paymentUrl: string | null;
  installments: number | null;
  payment: { id: string; paid: boolean; paidAt: Date | null } | null;
};

export function LoanCard({ loan: initialLoan, year, month, onToggle, onDelete }: {
  loan: Loan;
  year: number;
  month: number;
  onToggle: (id: string, paid: boolean) => Promise<{ id: string; paid: boolean; paidAt: Date | null } | null>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { cal, lang } = useCalendar();
  const [loan, setLoan] = useState(initialLoan);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  async function handleSave(id: string, data: Partial<Loan>) {
    const res = await fetch(`/api/loans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setLoan((prev) => ({ ...prev, ...updated }));
    setShowEdit(false);
  }
  const paid = loan.payment?.paid ?? false;

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const isOverdue = isCurrentMonth && !paid && now.getDate() > loan.dueDay;

  async function handleToggle() {
    setLoading(true);
    const payment = await onToggle(loan.id, !paid);
    if (payment) setLoan(prev => ({ ...prev, payment }));
    setLoading(false);
  }

  return (
    <div className={cn(
      "rounded-2xl border p-4 bg-white dark:bg-zinc-900 transition-all",
      paid ? "border-zinc-200 dark:border-zinc-800 opacity-60"
        : isOverdue ? "border-red-200 dark:border-red-900"
        : "border-zinc-200 dark:border-zinc-800",
    )}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => void handleToggle()}
          disabled={loading}
          className={cn(
            "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition",
            paid
              ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
              : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-900 dark:hover:border-white",
          )}
        >
          {loading ? (
            <span className="w-2.5 h-2.5 rounded-full border-2 border-zinc-400 border-t-zinc-900 dark:border-t-white animate-spin" />
          ) : paid ? (
            <Check className="w-3.5 h-3.5 text-white dark:text-zinc-900" strokeWidth={3} />
          ) : null}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("font-medium truncate", paid && "line-through text-zinc-400 dark:text-zinc-500")}>
              {loan.name}
            </span>
            <span className={cn("text-sm font-semibold tabular-nums flex-shrink-0", paid && "text-zinc-400 dark:text-zinc-500")}>
              {loan.amount.toLocaleString()} {loan.currency}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "text-xs",
              isOverdue && !paid ? "text-red-500 dark:text-red-400 font-medium" : "text-zinc-400 dark:text-zinc-500",
              lang === "fa" && "font-[vazirmatn,sans-serif]"
            )}>
              {isOverdue && !paid ? (lang === "fa" ? "تاخیر · " : "Overdue · ") : ""}
              {formatDueDay(loan.dueDay, cal)}
            </span>
          </div>

          {loan.installments && (
            <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {lang === "fa"
                ? `${loan.installments} قسط`
                : `${loan.installments} installments`}
            </div>
          )}

          {paid && loan.payment?.paidAt && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {lang === "fa" ? "پرداخت شد" : "Paid"}{" "}
              {new Date(loan.payment.paidAt).toLocaleDateString(lang === "fa" ? "fa-IR" : undefined, { month: "short", day: "numeric" })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div>
          {loan.paymentUrl && (
            <a
              href={loan.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-white hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {lang === "fa" ? "پرداخت" : "Pay now"}
            </a>
          )}
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">{lang === "fa" ? "حذف؟" : "Delete?"}</span>
            <button onClick={() => void onDelete(loan.id)} className="text-red-500 font-medium hover:underline">
              {lang === "fa" ? "بله" : "Yes"}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-zinc-400 hover:underline">
              {lang === "fa" ? "خیر" : "No"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white rounded-lg transition"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {showEdit && (
        <EditLoanModal loan={loan} onClose={() => setShowEdit(false)} onSave={handleSave} />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ExternalLink, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Loan = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  dueDay: number;
  paymentUrl: string | null;
  payment: { id: string; paid: boolean; paidAt: Date | null } | null;
};

function ordinal(n: number) {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function LoanCard({ loan, year, month, onToggle, onDelete }: {
  loan: Loan;
  year: number;
  month: number;
  onToggle: (id: string, paid: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const paid = loan.payment?.paid ?? false;

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const isOverdue = isCurrentMonth && !paid && now.getDate() > loan.dueDay;

  async function handleToggle() {
    setLoading(true);
    await onToggle(loan.id, !paid);
    setLoading(false);
  }

  return (
    <div className={cn(
      "rounded-2xl border p-4 bg-white dark:bg-zinc-900 transition-all",
      paid
        ? "border-zinc-300 dark:border-zinc-700"
        : isOverdue
          ? "border-red-200 dark:border-red-900"
          : "border-zinc-200 dark:border-zinc-800",
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => void handleToggle()}
          disabled={loading}
          className={cn(
            "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition",
            paid
              ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900"
              : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-900 dark:border-white",
          )}
        >
          {paid && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("font-medium truncate", paid && "line-through text-zinc-400 dark:text-zinc-500")}>
              {loan.name}
            </span>
            <span className={cn(
              "text-sm font-semibold tabular-nums flex-shrink-0",
              paid ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-white"
            )}>
              {loan.amount.toLocaleString()} {loan.currency}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "text-xs",
              isOverdue && !paid ? "text-red-500 dark:text-red-400 font-medium" : "text-zinc-400 dark:text-zinc-500"
            )}>
              {isOverdue && !paid ? "Overdue · " : ""}Due {ordinal(loan.dueDay)} of each month
            </span>
          </div>

          {paid && loan.payment?.paidAt && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Paid {new Date(loan.payment.paidAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {loan.paymentUrl && (
            <a
              href={loan.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-white  hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Pay now
            </a>
          )}
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Delete?</span>
            <button onClick={() => void onDelete(loan.id)} className="text-red-500 font-medium hover:underline">Yes</button>
            <button onClick={() => setConfirmDelete(false)} className="text-zinc-400 hover:underline">No</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useCalendar } from "./calendar-context";

const CURRENCIES = ["USD", "EUR", "GBP", "IRR", "AED", "CAD", "AUD"];

function formatAmount(raw: string) {
  const digits = raw.replace(/[^0-9.]/g, "");
  const parts = digits.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.slice(0, 2).join(".");
}
function parseAmount(f: string) { return f.replace(/,/g, ""); }

type Loan = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  dueDay: number;
  paymentUrl: string | null;
  installments: number | null;
};

export function EditLoanModal({ loan, onClose, onSave }: {
  loan: Loan;
  onClose: () => void;
  onSave: (id: string, data: Partial<Loan>) => Promise<void>;
}) {
  const { cal, lang } = useCalendar();
  const fa = lang === "fa";
  const [name, setName] = useState(loan.name);
  const [amountDisplay, setAmountDisplay] = useState(loan.amount.toLocaleString());
  const [currency, setCurrency] = useState(loan.currency);
  const [dueDay, setDueDay] = useState(String(loan.dueDay));
  const [paymentUrl, setPaymentUrl] = useState(loan.paymentUrl ?? "");
  const [installments, setInstallments] = useState(loan.installments ? String(loan.installments) : "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSave(loan.id, {
      name: name.trim(),
      amount: parseFloat(parseAmount(amountDisplay)),
      currency,
      dueDay: parseInt(dueDay, 10),
      paymentUrl: paymentUrl.trim() || null,
      installments: installments ? parseInt(installments, 10) : null,
    });
    setLoading(false);
  }

  const inputCls = "mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-white transition text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">{fa ? "ویرایش وام" : "Edit loan"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => void submit(e)} className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{fa ? "نام" : "Name"}</span>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{fa ? "مبلغ" : "Amount"}</span>
              <input type="text" inputMode="decimal" required value={amountDisplay} onChange={e => setAmountDisplay(formatAmount(e.target.value))} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{fa ? "ارز" : "Currency"}</span>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{fa ? "روز سررسید" : "Due day"}</span>
              <input type="number" required min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {fa ? "تعداد اقساط" : "Installments"}
                <span className="text-zinc-400 font-normal"> ({fa ? "اختیاری" : "opt"})</span>
              </span>
              <input type="number" min="1" placeholder={fa ? "نامحدود" : "∞"} value={installments} onChange={e => setInstallments(e.target.value)} className={inputCls} />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {fa ? "لینک پرداخت" : "Payment link"}
              <span className="text-zinc-400 font-normal"> ({fa ? "اختیاری" : "opt"})</span>
            </span>
            <input type="url" placeholder="https://" value={paymentUrl} onChange={e => setPaymentUrl(e.target.value)} className={inputCls} />
          </label>

          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-zinc-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-60 transition">
            {loading ? (fa ? "در حال ذخیره…" : "Saving…") : (fa ? "ذخیره" : "Save changes")}
          </button>
        </form>
      </div>
    </div>
  );
}

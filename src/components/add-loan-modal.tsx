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

function parseAmount(formatted: string) {
  return formatted.replace(/,/g, "");
}

export function AddLoanModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (data: { name: string; amount: number; currency: string; dueDay: number; paymentUrl: string; installments: number | null }) => Promise<void>;
}) {
  const { cal } = useCalendar();
  const fa = cal === "jalali";
  const [name, setName] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [dueDay, setDueDay] = useState("1");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [installments, setInstallments] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(parseAmount(amountDisplay));
    if (!name || !amount || !dueDay) return;
    setLoading(true);
    await onAdd({
      name: name.trim(),
      amount,
      currency,
      dueDay: parseInt(dueDay, 10),
      paymentUrl: paymentUrl.trim(),
      installments: installments ? parseInt(installments, 10) : null,
    });
    setLoading(false);
  }

  const inputCls = "mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-white transition text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">{fa ? "افزودن وام" : "Add loan"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => void submit(e)} className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{fa ? "نام" : "Name"}</span>
            <input type="text" required placeholder={fa ? "مثال: وام خودرو" : "e.g. Car loan, Mortgage"} value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{fa ? "مبلغ" : "Amount"}</span>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="0"
                value={amountDisplay}
                onChange={e => setAmountDisplay(formatAmount(e.target.value))}
                className={inputCls}
              />
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
                <span className="text-zinc-400 font-normal"> ({fa ? "اختیاری" : "optional"})</span>
              </span>
              <input type="number" min="1" placeholder={fa ? "نامحدود" : "∞ forever"} value={installments} onChange={e => setInstallments(e.target.value)} className={inputCls} />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {fa ? "لینک پرداخت" : "Payment link"}
              <span className="text-zinc-400 font-normal"> ({fa ? "اختیاری" : "optional"})</span>
            </span>
            <input type="url" placeholder="https://" value={paymentUrl} onChange={e => setPaymentUrl(e.target.value)} className={inputCls} />
          </label>

          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-zinc-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-60 transition mt-2">
            {loading ? (fa ? "در حال ذخیره…" : "Adding…") : (fa ? "افزودن" : "Add loan")}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

const CURRENCIES = ["USD", "EUR", "GBP", "IRR", "AED", "CAD", "AUD"];

export function AddLoanModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (data: { name: string; amount: number; currency: string; dueDay: number; paymentUrl: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [dueDay, setDueDay] = useState("1");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !amount || !dueDay) return;
    setLoading(true);
    await onAdd({
      name: name.trim(),
      amount: parseFloat(amount),
      currency,
      dueDay: parseInt(dueDay, 10),
      paymentUrl: paymentUrl.trim(),
    });
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Add loan</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => void submit(e)} className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</span>
            <input
              type="text"
              required
              placeholder="e.g. Car loan, Mortgage"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Amount</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Currency</span>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition text-sm"
              >
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Due day of month</span>
            <input
              type="number"
              required
              min="1"
              max="31"
              value={dueDay}
              onChange={e => setDueDay(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Payment link <span className="text-zinc-400">(optional)</span></span>
            <input
              type="url"
              placeholder="https://bank.example.com/pay"
              value={paymentUrl}
              onChange={e => setPaymentUrl(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition mt-2"
          >
            {loading ? "Adding…" : "Add loan"}
          </button>
        </form>
      </div>
    </div>
  );
}

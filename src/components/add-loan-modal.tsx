"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useCalendar } from "./calendar-context";
import { toJalali, fromJalali, JALALI_MONTHS, GREGORIAN_MONTHS } from "@/lib/calendar";

const CURRENCIES = ["USD", "EUR", "GBP", "IRR", "AED", "CAD", "AUD", "TRY", "CNY", "JPY"];

function formatAmount(raw: string) {
  const digits = raw.replace(/[^0-9.]/g, "");
  const parts = digits.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.slice(0, 2).join(".");
}
function parseAmount(f: string) { return f.replace(/,/g, ""); }

type StartMode = "this" | "next" | "custom";

export function AddLoanModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (data: {
    name: string; amount: number; currency: string; dueDay: number;
    paymentUrl: string; installments: number | null;
    startYear: number; startMonth: number;
  }) => Promise<void>;
}) {
  const { cal, currency: defaultCurrency } = useCalendar();
  const fa = cal === "jalali";

  const now = new Date();
  const gYear = now.getFullYear();
  const gMonth = now.getMonth() + 1;
  const thisJalali = toJalali(gYear, gMonth);
  const nextG = gMonth === 12 ? { year: gYear + 1, month: 1 } : { year: gYear, month: gMonth + 1 };
  const nextJalali = toJalali(nextG.year, nextG.month);

  const [name, setName] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [dueDay, setDueDay] = useState("1");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [installments, setInstallments] = useState("");
  const [startMode, setStartMode] = useState<StartMode>("this");
  const [customMonth, setCustomMonth] = useState(fa ? String(thisJalali.month) : String(gMonth));
  const [customYear, setCustomYear] = useState(fa ? String(thisJalali.year) : String(gYear));
  const [loading, setLoading] = useState(false);

  function resolveStart(): { startYear: number; startMonth: number } {
    if (startMode === "this") return { startYear: gYear, startMonth: gMonth };
    if (startMode === "next") return { startYear: nextG.year, startMonth: nextG.month };
    const jm = parseInt(customMonth, 10);
    const jy = parseInt(customYear, 10);
    if (fa) {
      const g = fromJalali(jy, jm);
      return { startYear: g.year, startMonth: g.month };
    }
    return { startYear: jy, startMonth: jm };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(parseAmount(amountDisplay));
    if (!name || !amount || !dueDay) return;
    setLoading(true);
    await onAdd({
      name: name.trim(), amount, currency,
      dueDay: parseInt(dueDay, 10),
      paymentUrl: paymentUrl.trim(),
      installments: installments ? parseInt(installments, 10) : null,
      ...resolveStart(),
    });
    setLoading(false);
  }

  const inputCls = "mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-white transition text-sm";

  const startOptions: { value: StartMode; label: string; sub: string }[] = [
    {
      value: "this",
      label: fa ? "ماه جاری" : "This month",
      sub: fa ? JALALI_MONTHS[thisJalali.month - 1] + " " + thisJalali.year : GREGORIAN_MONTHS[gMonth - 1] + " " + gYear,
    },
    {
      value: "next",
      label: fa ? "ماه آینده" : "Next month",
      sub: fa ? JALALI_MONTHS[nextJalali.month - 1] + " " + nextJalali.year : GREGORIAN_MONTHS[nextG.month - 1] + " " + nextG.year,
    },
    { value: "custom", label: fa ? "انتخاب ماه" : "Custom", sub: "" },
  ];

  const months = fa ? JALALI_MONTHS : GREGORIAN_MONTHS;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900">
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
              <input type="text" inputMode="decimal" required placeholder="0" value={amountDisplay} onChange={e => setAmountDisplay(formatAmount(e.target.value))} className={inputCls} />
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

          {/* Start date */}
          <div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{fa ? "از چه ماهی" : "Starting from"}</span>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {startOptions.map(opt => (
                <button key={opt.value} type="button" onClick={() => setStartMode(opt.value)}
                  className={`rounded-xl border px-2 py-2.5 text-left transition ${startMode === opt.value ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"}`}>
                  <div className={`text-xs font-medium ${startMode === opt.value ? "text-white dark:text-zinc-900" : "text-zinc-900 dark:text-white"}`}>{opt.label}</div>
                  {opt.sub && <div className={`text-xs mt-0.5 ${startMode === opt.value ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400"}`}>{opt.sub}</div>}
                </button>
              ))}
            </div>
            {startMode === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <label className="block">
                  <span className="text-xs text-zinc-500">{fa ? "ماه" : "Month"}</span>
                  <select value={customMonth} onChange={e => setCustomMonth(e.target.value)} className={inputCls}>
                    {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-zinc-500">{fa ? "سال" : "Year"}</span>
                  <input type="number" value={customYear} onChange={e => setCustomYear(e.target.value)} className={inputCls} />
                </label>
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {fa ? "لینک پرداخت" : "Payment link"}
              <span className="text-zinc-400 font-normal"> ({fa ? "اختیاری" : "opt"})</span>
            </span>
            <input type="url" placeholder="https://" value={paymentUrl} onChange={e => setPaymentUrl(e.target.value)} className={inputCls} />
          </label>

          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-zinc-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-60 transition">
            {loading ? (fa ? "در حال ذخیره…" : "Adding…") : (fa ? "افزودن" : "Add loan")}
          </button>
        </form>
      </div>
    </div>
  );
}

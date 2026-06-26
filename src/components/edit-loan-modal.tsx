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

type StartMode = "existing" | "custom";

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

export function EditLoanModal({ loan, onClose, onSave }: {
  loan: Loan;
  onClose: () => void;
  onSave: (id: string, data: Partial<Loan>) => Promise<void>;
}) {
  const { cal, lang } = useCalendar();
  const fa = lang === "fa";
  const shamsi = cal === "jalali";

  const now = new Date();
  const gYear = now.getFullYear();
  const gMonth = now.getMonth() + 1;

  // Convert existing start to display calendar for default custom values
  const existingJalali = shamsi ? toJalali(loan.startYear, loan.startMonth, 1) : null;
  const existingDisplayMonth = existingJalali ? existingJalali.month : loan.startMonth;
  const existingDisplayYear = existingJalali ? existingJalali.year : loan.startYear;

  const [name, setName] = useState(loan.name);
  const [amountDisplay, setAmountDisplay] = useState(loan.amount.toLocaleString());
  const [currency, setCurrency] = useState(loan.currency);
  const [dueDay, setDueDay] = useState(String(loan.dueDay));
  const [paymentUrl, setPaymentUrl] = useState(loan.paymentUrl ?? "");
  const [installments, setInstallments] = useState(loan.installments ? String(loan.installments) : "");
  const [startMode, setStartMode] = useState<StartMode>("existing");
  const [customMonth, setCustomMonth] = useState(String(existingDisplayMonth));
  const [customYear, setCustomYear] = useState(String(existingDisplayYear));
  const [loading, setLoading] = useState(false);

  function resolveStart(): { startYear: number; startMonth: number } {
    if (startMode === "existing") return { startYear: loan.startYear, startMonth: loan.startMonth };
    const jm = parseInt(customMonth, 10);
    const jy = parseInt(customYear, 10);
    if (shamsi) {
      const g = fromJalali(jy, jm);
      return { startYear: g.year, startMonth: g.month };
    }
    return { startYear: jy, startMonth: jm };
  }

  // Existing start label
  const existingLabel = (() => {
    if (shamsi && existingJalali) return `${JALALI_MONTHS[existingJalali.month - 1]} ${existingJalali.year}`;
    return `${GREGORIAN_MONTHS[loan.startMonth - 1]} ${loan.startYear}`;
  })();

  const months = shamsi ? JALALI_MONTHS : GREGORIAN_MONTHS;

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
      ...resolveStart(),
    });
    setLoading(false);
  }

  const inputCls = "mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-white transition text-sm";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col sheet-enter" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <h2 className="font-semibold text-zinc-900 dark:text-white">{fa ? "ویرایش وام" : "Edit loan"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
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

            {/* Start date */}
            <div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{fa ? "از چه ماهی" : "Starting from"}</span>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {([
                  { value: "existing" as StartMode, label: fa ? "بدون تغییر" : "Keep current", sub: existingLabel },
                  { value: "custom" as StartMode, label: fa ? "تغییر" : "Change", sub: "" },
                ]).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setStartMode(opt.value)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${startMode === opt.value ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"}`}>
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
              {loading ? (fa ? "در حال ذخیره…" : "Saving…") : (fa ? "ذخیره" : "Save changes")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { ThemeToggle } from "./theme-toggle";
import {
	toJalali,
	fromJalali,
	JALALI_MONTHS,
	GREGORIAN_MONTHS,
	getDaysInJalaliMonth,
	getDaysInGregorianMonth,
	getMonthStartOffset,
	JALALI_WEEK_DAYS,
	GREGORIAN_WEEK_DAYS,
} from "@/lib/calendar";

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

const LOAN_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899"];
function loanColor(id: string): string {
	let h = 0;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
	return LOAN_COLORS[Math.abs(h) % LOAN_COLORS.length];
}

export function CalendarView(props: { loans: Loan[]; allPayments: Payment[] }) {
	return (
		<CalendarProvider>
			<CalendarInner {...props} />
		</CalendarProvider>
	);
}

const _now = new Date();

function CalendarInner({ loans, allPayments: initialPayments }: { loans: Loan[]; allPayments: Payment[] }) {
	const { cal, lang } = useCalendar();
	const fa = lang === "fa";
	const now = _now;

	const initYear = cal === "jalali"
		? toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate()).year
		: now.getFullYear();
	const initMonth = cal === "jalali"
		? toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate()).month
		: now.getMonth() + 1;

	const [dispYear, setDispYear] = useState(initYear);
	const [dispMonth, setDispMonth] = useState(initMonth);
	const [allPayments, setAllPayments] = useState<Payment[]>(initialPayments);
	const [toggling, setToggling] = useState<string | null>(null);

	useEffect(() => {
		if (cal === "jalali") {
			const j = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
			setDispYear(j.year); setDispMonth(j.month);
		} else {
			setDispYear(now.getFullYear()); setDispMonth(now.getMonth() + 1);
		}
	}, [cal, now]);

	// O(1) payment lookup
	const paymentMap = useMemo(() => {
		const m = new Map<string, Payment>();
		for (const p of allPayments) m.set(`${p.loanId}-${p.year}-${p.month}`, p);
		return m;
	}, [allPayments]);

	function prevMonth() {
		if (dispMonth === 1) { setDispMonth(12); setDispYear(y => y - 1); }
		else setDispMonth(m => m - 1);
	}
	function nextMonth() {
		if (dispMonth === 12) { setDispMonth(1); setDispYear(y => y + 1); }
		else setDispMonth(m => m + 1);
	}
	function goToday() {
		if (cal === "jalali") {
			const j = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
			setDispYear(j.year); setDispMonth(j.month);
		} else {
			setDispYear(now.getFullYear()); setDispMonth(now.getMonth() + 1);
		}
	}

	const isCurrentDisplayMonth = (() => {
		if (cal === "jalali") {
			const j = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
			return dispYear === j.year && dispMonth === j.month;
		}
		return dispYear === now.getFullYear() && dispMonth === now.getMonth() + 1;
	})();

	const monthLabel = cal === "jalali"
		? `${JALALI_MONTHS[dispMonth - 1]} ${dispYear}`
		: `${GREGORIAN_MONTHS[dispMonth - 1]} ${dispYear}`;

	const numDays = cal === "jalali"
		? getDaysInJalaliMonth(dispYear, dispMonth)
		: getDaysInGregorianMonth(dispYear, dispMonth);

	const offset = getMonthStartOffset(dispYear, dispMonth, cal);
	const weekDays = cal === "jalali" ? JALALI_WEEK_DAYS : GREGORIAN_WEEK_DAYS;

	const { year: dispGYear, month: dispGMonth } = cal === "jalali"
		? fromJalali(dispYear, dispMonth, 15)
		: { year: dispYear, month: dispMonth };

	function loanActiveForGMonth(loan: Loan, gYear: number, gMonth: number): boolean {
		const startTotal = loan.startYear * 12 + loan.startMonth - 1;
		const curTotal = gYear * 12 + gMonth - 1;
		if (curTotal < startTotal) return false;
		if (loan.installments) {
			if (curTotal > startTotal + loan.installments - 1) return false;
		}
		return true;
	}

	function loansDueOnDay(day: number): Array<{ loan: Loan; paid: boolean }> {
		return loans
			.filter(l => l.dueDay === day && loanActiveForGMonth(l, dispGYear, dispGMonth))
			.map(l => ({
				loan: l,
				paid: paymentMap.get(`${l.id}-${dispGYear}-${dispGMonth}`)?.paid ?? false,
			}));
	}

	const visibleLoans = loans.filter(l => loanActiveForGMonth(l, dispGYear, dispGMonth));

	const todayDispDay = (() => {
		if (cal === "jalali") {
			const j = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
			return j.year === dispYear && j.month === dispMonth ? j.day : null;
		}
		return now.getFullYear() === dispYear && now.getMonth() + 1 === dispMonth ? now.getDate() : null;
	})();

	async function togglePaid(loanId: string, paid: boolean) {
		const key = `${loanId}-${dispGYear}-${dispGMonth}`;
		setToggling(key);
		const res = await fetch("/api/payments", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ loanId, year: dispGYear, month: dispGMonth, paid }),
		});
		if (res.ok) {
			const payment: Payment = await res.json();
			setAllPayments(prev => [
				...prev.filter(p => !(p.loanId === loanId && p.year === dispGYear && p.month === dispGMonth)),
				payment,
			]);
		}
		setToggling(null);
	}

	const totalCells = offset + numDays;
	const rows = Math.ceil(totalCells / 7);

	const paidCount = visibleLoans.filter(l => paymentMap.get(`${l.id}-${dispGYear}-${dispGMonth}`)?.paid).length;

	return (
		<div
			className={`min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 ${fa ? "font-[family-name:var(--font-vazirmatn)]" : ""}`}
			dir={fa ? "rtl" : "ltr"}
		>
			<header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
				<div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
					<Link
						href="/dashboard"
						className="p-2 -ms-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition"
					>
						<ArrowLeft className={cn("w-4 h-4", fa && "rotate-180")} />
					</Link>
					<span className="font-semibold text-zinc-900 dark:text-white flex-1">
						{fa ? "تقویم" : "Calendar"}
					</span>
					<ThemeToggle />
				</div>
			</header>

			<main className="max-w-2xl mx-auto w-full px-4 py-5 flex flex-col gap-5 pb-12">
				{/* Month nav */}
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={prevMonth}
						className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
					>
						{fa ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
					</button>
					<div className="flex-1 text-center">
						<h2 className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight">
							{monthLabel}
						</h2>
						{!isCurrentDisplayMonth && (
							<button
								type="button"
								onClick={goToday}
								className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition mt-0.5"
							>
								{fa ? "← برگشت به امروز" : "← back to today"}
							</button>
						)}
					</div>
					<button
						type="button"
						onClick={nextMonth}
						className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
					>
						{fa ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
					</button>
				</div>

				{/* Calendar grid */}
				<div className="rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-100 dark:ring-zinc-800 overflow-hidden">
					{/* Week day headers */}
					<div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
						{weekDays.map((d) => (
							<div key={d} className="py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
								{d}
							</div>
						))}
					</div>

					{/* Day cells */}
					<div className="grid grid-cols-7">
						{Array.from({ length: rows * 7 }, (_, i) => {
							const day = i - offset + 1;
							const isValid = day >= 1 && day <= numDays;
							if (!isValid) return <div key={i} className="h-14" />;

							const dueLoanInfos = loansDueOnDay(day);
							const isToday = day === todayDispDay;
							const allPaid = dueLoanInfos.length > 0 && dueLoanInfos.every(x => x.paid);

							return (
								<div
									key={i}
									className={cn(
										"h-14 flex flex-col items-center justify-start pt-2 gap-1 border-t border-zinc-50 dark:border-zinc-800/50",
										isToday && "bg-zinc-50 dark:bg-zinc-800/40",
									)}
								>
									<span className={cn(
										"w-7 h-7 flex items-center justify-center rounded-full text-sm tabular-nums",
										isToday
											? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold"
											: "text-zinc-600 dark:text-zinc-400",
									)}>
										{cal === "jalali" ? day.toLocaleString(`${fa ? "fa" : "en"}-IR`) : day}
									</span>
									{dueLoanInfos.length > 0 && (
										<div className="flex gap-0.5">
											{dueLoanInfos.slice(0, 4).map(({ loan, paid }) => (
												<div
													key={loan.id}
													className="w-1.5 h-1.5 rounded-full"
													style={{ backgroundColor: paid ? "#d4d4d8" : loanColor(loan.id) }}
												/>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* This month's loans */}
				{visibleLoans.length > 0 && (
					<div>
						{/* Section header */}
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
								{fa ? "سررسیدهای این ماه" : "Due this month"}
							</h3>
							{visibleLoans.length > 0 && (
								<span className={cn(
									"text-[11px] tabular-nums font-medium",
									paidCount === visibleLoans.length
										? "text-emerald-500 dark:text-emerald-400"
										: "text-zinc-400 dark:text-zinc-500",
								)}>
									{paidCount === visibleLoans.length
										? fa ? "✓ همه پرداخت شد" : "✓ all done"
										: `${paidCount}/${visibleLoans.length} ${fa ? "پرداخت شد" : "paid"}`}
								</span>
							)}
						</div>

						<div className="rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-100 dark:ring-zinc-800 overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-800">
							{visibleLoans
								.sort((a, b) => a.dueDay - b.dueDay)
								.map((l) => {
									const payment = paymentMap.get(`${l.id}-${dispGYear}-${dispGMonth}`);
									const paid = payment?.paid ?? false;
									const key = `${l.id}-${dispGYear}-${dispGMonth}`;
									const isLoading = toggling === key;

									return (
										<div key={l.id} className={cn("flex items-center gap-3 px-4 py-3.5 transition", paid && "opacity-45")}>
											{/* Toggle */}
											<button
												type="button"
												onClick={() => void togglePaid(l.id, !paid)}
												disabled={isLoading}
												className={cn(
													"w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
													paid
														? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
														: "border-zinc-300 dark:border-zinc-600 hover:border-zinc-900 dark:hover:border-white",
												)}
											>
												{isLoading ? (
													<span className="w-2 h-2 rounded-full border border-zinc-300 border-t-zinc-900 dark:border-t-white animate-spin" />
												) : paid ? (
													<Check className="w-3 h-3 text-white dark:text-zinc-900" strokeWidth={3} />
												) : null}
											</button>

											{/* Color dot */}
											<div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: paid ? "#d4d4d8" : loanColor(l.id) }} />

											{/* Info */}
											<Link href={`/loans/${l.id}`} className="flex-1 min-w-0 group">
												<div className={cn(
													"text-sm font-medium truncate transition-colors",
													paid
														? "line-through text-zinc-400 dark:text-zinc-500"
														: "text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300",
												)}>
													{l.name}
												</div>
												<div className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums mt-0.5">
													{fa ? `روز ${l.dueDay}` : `Day ${l.dueDay}`} · {l.amount.toLocaleString()} {l.currency}
												</div>
											</Link>

											{paid && payment?.paidAt && (
												<span className="text-xs text-zinc-300 dark:text-zinc-600 tabular-nums shrink-0">
													{new Date(payment.paidAt).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", { month: "short", day: "numeric" })}
												</span>
											)}
										</div>
									);
								})}
						</div>
					</div>
				)}

				{visibleLoans.length === 0 && (
					<div className="text-center py-16">
						<div className="text-3xl mb-3">🗓</div>
						<p className="text-sm text-zinc-400 dark:text-zinc-500">
							{fa ? "هیچ سررسیدی در این ماه وجود ندارد" : "No payments due this month"}
						</p>
					</div>
				)}
			</main>
		</div>
	);
}

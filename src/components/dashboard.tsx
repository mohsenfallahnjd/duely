"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { LoanSection } from "./loan-section";
import { AddLoanModal } from "./add-loan-modal";
import { SettingsModal } from "./settings-modal";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { ToastProvider, useToast } from "./toast";
import {
	toJalali,
	fromJalali,
	JALALI_MONTHS,
	GREGORIAN_MONTHS,
	getMonthLabel,
	isCurrentMonth,
} from "@/lib/calendar";
import {
	Plus,
	Settings,
	CalendarDays,
	LayoutList,
	Rows3,
	Check,
	ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

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
	active: boolean;
};

type Payment = {
	id: string;
	loanId: string;
	year: number;
	month: number;
	paid: boolean;
	paidAt: Date | null;
};

export function Dashboard(props: { loans: Loan[]; allPayments: Payment[] }) {
	return (
		<CalendarProvider>
			<ToastProvider>
				<DashboardInner {...props} />
			</ToastProvider>
		</CalendarProvider>
	);
}

function DashboardInner({
	loans: initialLoans,
	allPayments: initialPayments,
}: {
	loans: Loan[];
	allPayments: Payment[];
}) {
	const { cal, lang } = useCalendar();
	const fa = lang === "fa";
	const { toast } = useToast();
	const [loans, setLoans] = useState(initialLoans);
	const [allPayments, setAllPayments] = useState<Payment[]>(initialPayments);
	const [showAdd, setShowAdd] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [viewMode, setViewMode] = useState<"by-loan" | "by-month">("by-month");

	// Date — update at midnight only
	const [today, setToday] = useState(() => {
		const d = new Date();
		return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
	});
	useEffect(() => {
		function scheduleNextMidnight() {
			const now = new Date();
			const msUntilMidnight =
				new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate() + 1,
				).getTime() - now.getTime();
			return setTimeout(() => {
				const d = new Date();
				setToday({
					year: d.getFullYear(),
					month: d.getMonth() + 1,
					day: d.getDate(),
				});
				timerId = scheduleNextMidnight();
			}, msUntilMidnight);
		}
		let timerId = scheduleNextMidnight();
		return () => clearTimeout(timerId);
	}, []);

	// O(1) payment lookup map
	const paymentMap = useMemo(() => {
		const m = new Map<string, Payment>();
		for (const p of allPayments) {
			m.set(`${p.loanId}-${p.year}-${p.month}`, p);
		}
		return m;
	}, [allPayments]);

	const getPayment = useCallback(
		(loanId: string, year: number, month: number): Payment | null =>
			paymentMap.get(`${loanId}-${year}-${month}`) ?? null,
		[paymentMap],
	);

	const togglePaid = useCallback(
		async (
			loanId: string,
			year: number,
			month: number,
			paid: boolean,
		): Promise<Payment | null> => {
			const res = await fetch("/api/payments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ loanId, year, month, paid }),
			});
			if (!res.ok) {
				toast(fa ? "خطا در ثبت پرداخت" : "Failed to update", "error");
				return null;
			}
			const payment: Payment = await res.json();
			setAllPayments((prev) => {
				const filtered = prev.filter(
					(p) => !(p.loanId === loanId && p.year === year && p.month === month),
				);
				return [...filtered, payment];
			});
			toast(
				paid
					? fa
						? "پرداخت ثبت شد ✓"
						: "Marked paid ✓"
					: fa
						? "پرداخت لغو شد"
						: "Payment removed",
			);
			return payment;
		},
		[fa, toast],
	);

	const addLoan = useCallback(
		async (data: {
			name: string;
			amount: number;
			currency: string;
			dueDay: number;
			paymentUrl: string;
			installments: number | null;
			startYear: number;
			startMonth: number;
		}) => {
			const res = await fetch("/api/loans", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				toast(fa ? "خطا در افزودن وام" : "Failed to add loan", "error");
				return;
			}
			const loan = await res.json();
			setLoans((prev) => [...prev, loan]);
			setShowAdd(false);
			toast(fa ? "وام اضافه شد ✓" : "Loan added ✓");
		},
		[fa, toast],
	);

	const deleteLoan = useCallback(
		async (id: string) => {
			const res = await fetch(`/api/loans/${id}`, { method: "DELETE" });
			setLoans((prev) => prev.filter((l) => l.id !== id));
			if (res.ok) toast(fa ? "وام حذف شد" : "Loan deleted");
		},
		[fa, toast],
	);

	const updateLoan = useCallback(
		async (id: string, data: Partial<Loan>) => {
			const res = await fetch(`/api/loans/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				toast(fa ? "خطا در ذخیره" : "Failed to save", "error");
				return;
			}
			const updated = await res.json();
			setLoans((prev) =>
				prev.map((l) => (l.id === id ? { ...l, ...updated } : l)),
			);
			toast(fa ? "ذخیره شد ✓" : "Saved ✓");
		},
		[fa, toast],
	);

	const todayLabel = useMemo(() => {
		const now = new Date(today.year, today.month - 1, today.day);
		if (cal === "jalali") {
			const j = toJalali(today.year, today.month, today.day);
			return fa
				? `${j.day} ${JALALI_MONTHS[j.month - 1]} ${j.year}`
				: `${JALALI_MONTHS[j.month - 1]} ${j.day}, ${j.year}`;
		}
		return now.toLocaleDateString(fa ? "fa-IR" : "en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}, [today, cal, fa]);

	const allMonths = useMemo(() => {
		const curTotal = today.year * 12 + today.month - 1;
		const monthSet = new Map<string, { year: number; month: number }>();
		for (const loan of loans) {
			const startTotal = loan.startYear * 12 + loan.startMonth - 1;
			const endTotal = loan.installments
				? startTotal + loan.installments - 1
				: curTotal + 3;
			for (let t = startTotal; t <= endTotal; t++) {
				const y = Math.floor(t / 12);
				const m = (t % 12) + 1;
				monthSet.set(`${y}-${m}`, { year: y, month: m });
			}
		}
		return [...monthSet.values()].sort((a, b) =>
			a.year !== b.year ? a.year - b.year : a.month - b.month,
		);
	}, [loans, today]);

	// Summary stats for current month
	const currentMonthSummary = useMemo(() => {
		const curTotal = today.year * 12 + today.month - 1;
		const totals: Record<
			string,
			{ total: number; paid: number; count: number; paidCount: number }
		> = {};
		for (const loan of loans) {
			const startTotal = loan.startYear * 12 + loan.startMonth - 1;
			if (curTotal < startTotal) continue;
			if (loan.installments && curTotal > startTotal + loan.installments - 1)
				continue;
			const p = getPayment(loan.id, today.year, today.month);
			if (!totals[loan.currency])
				totals[loan.currency] = { total: 0, paid: 0, count: 0, paidCount: 0 };
			totals[loan.currency].total += loan.amount;
			totals[loan.currency].count += 1;
			if (p?.paid) {
				totals[loan.currency].paid += loan.amount;
				totals[loan.currency].paidCount += 1;
			}
		}
		return totals;
	}, [loans, today, getPayment]);

	return (
		<div
			className={`min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 ${fa ? "font-[family-name:var(--font-vazirmatn)]" : ""}`}
			dir={fa ? "rtl" : "ltr"}
		>
			<header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-20">
				<div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
					{/* Wordmark + date/time */}
					<div className="flex-1 min-w-0 flex flex-col">
						<span className="text-lg font-black tracking-[-0.04em] text-zinc-900 dark:text-white leading-none">
							Duely
						</span>
						<span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums mt-2	 leading-none">
							{todayLabel}
						</span>
					</div>

					{/* View toggle */}
					{loans.length > 0 && (
						<div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 gap-0.5">
							{(
								[
									{ mode: "by-month", icon: <Rows3 className="w-3.5 h-3.5" />, label: fa ? "ماهانه" : "Monthly" },
									{ mode: "by-loan",  icon: <LayoutList className="w-3.5 h-3.5" />, label: fa ? "وام‌ها" : "Loans" },
								] as const
							).map(({ mode, icon, label }) => (
								<button
									key={mode}
									type="button"
									onClick={() => setViewMode(mode)}
									className={cn(
										"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all",
										viewMode === mode
											? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
											: "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
									)}
								>
									{icon}
									{label}
								</button>
							))}
						</div>
					)}

					{/* Actions */}
					<div className="flex items-center gap-0.5 shrink-0">
						<Link
							href="/calendar"
							className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition"
						>
							<CalendarDays className="w-4 h-4" />
						</Link>
						<button
							type="button"
							onClick={() => setShowSettings(true)}
							className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition"
						>
							<Settings className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Current month summary strip */}
				{loans.length > 0 && Object.keys(currentMonthSummary).length > 0 && (
					<div className="max-w-2xl mx-auto px-4 pb-3 flex items-center gap-4">
						<span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
							{fa ? "این ماه" : "this month"}
						</span>
						<div className="flex-1 flex items-center gap-3 justify-end flex-wrap">
							{Object.entries(currentMonthSummary).map(
								([cur, { total, paid, count, paidCount }]) => {
									const rem = total - paid;
									const allDone = paidCount === count;
									return (
										<div key={cur} className="flex items-center gap-1.5">
											<div className="h-1 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
												<div
													className={cn(
														"h-full rounded-full transition-[width] duration-500",
														allDone
															? "bg-emerald-500"
															: "bg-zinc-400 dark:bg-zinc-500",
													)}
													style={{
														width:
															count > 0
																? `${(paidCount / count) * 100}%`
																: "0%",
													}}
												/>
											</div>
											<span
												className={cn(
													"text-[11px] tabular-nums font-medium",
													allDone
														? "text-emerald-500 dark:text-emerald-400"
														: "text-zinc-500 dark:text-zinc-400",
												)}
											>
												{allDone
													? fa
														? "تمام شد ✓"
														: "all done ✓"
													: `${rem.toLocaleString()} ${cur} ${fa ? "باقی‌مانده" : "left"}`}
											</span>
										</div>
									);
								},
							)}
						</div>
					</div>
				)}
			</header>

			<main className="max-w-2xl mx-auto w-full px-4 py-5 pb-24 flex flex-col gap-3 flex-1">
				{loans.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 text-center">
						<div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
							<span className="text-3xl">📋</span>
						</div>
						<p className="text-zinc-600 dark:text-zinc-400 font-medium">
							{fa ? "وامی ثبت نشده" : "No loans yet"}
						</p>
						<p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
							{fa ? "اولین وام خود را اضافه کنید" : "Add your first loan below"}
						</p>
					</div>
				) : viewMode === "by-loan" ? (
					loans.map((loan) => (
						<LoanSection
							key={loan.id}
							loan={loan}
							now={new Date(today.year, today.month - 1, today.day)}
							getPayment={getPayment}
							onToggle={togglePaid}
							onDelete={deleteLoan}
							onUpdate={updateLoan}
						/>
					))
				) : (
					<ByMonthView
						loans={loans}
						allMonths={allMonths}
						today={today}
						cal={cal}
						fa={fa}
						lang={lang}
						getPayment={getPayment}
						onToggle={togglePaid}
					/>
				)}
			</main>

			<button
				type="button"
				onClick={() => setShowAdd(true)}
				className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
				title={fa ? "افزودن وام" : "Add loan"}
			>
				<Plus className="w-6 h-6" />
			</button>

			{showAdd && (
				<AddLoanModal onClose={() => setShowAdd(false)} onAdd={addLoan} />
			)}
			{showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
		</div>
	);
}

const LOAN_COLORS = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#06b6d4",
	"#3b82f6",
	"#a855f7",
	"#ec4899",
];
function loanColor(id: string): string {
	let h = 0;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
	return LOAN_COLORS[Math.abs(h) % LOAN_COLORS.length];
}

type Today = { year: number; month: number; day: number };

interface ByMonthViewProps {
	loans: Loan[];
	allMonths: Array<{ year: number; month: number }>;
	today: Today;
	cal: string;
	fa: boolean;
	lang: string;
	getPayment: (loanId: string, year: number, month: number) => Payment | null;
	onToggle: (
		loanId: string,
		year: number,
		month: number,
		paid: boolean,
	) => Promise<Payment | null>;
}

const ByMonthView = memo(function ByMonthView({
	loans,
	allMonths,
	today,
	cal,
	fa,
	lang,
	getPayment,
	onToggle,
}: ByMonthViewProps) {
	const curTotal = today.year * 12 + today.month - 1;
	const [toggling, setToggling] = useState<string | null>(null);
	const [collapsed, setCollapsed] = useState<Set<string>>(() => {
		const s = new Set<string>();
		for (const { year, month } of allMonths) {
			if (year * 12 + month - 1 < curTotal) s.add(`${year}-${month}`);
		}
		return s;
	});

	const curMonthRef = React.useRef<HTMLDivElement | null>(null);
	React.useEffect(() => {
		if (curMonthRef.current) {
			setTimeout(
				() =>
					curMonthRef.current?.scrollIntoView({
						behavior: "smooth",
						block: "center",
					}),
				150,
			);
		}
	}, []);

	const handleToggle = useCallback(
		async (loanId: string, year: number, month: number, paid: boolean) => {
			const key = `${loanId}-${year}-${month}`;
			setToggling(key);
			await onToggle(loanId, year, month, paid);
			setToggling(null);
		},
		[onToggle],
	);

	const toggleCollapse = useCallback((key: string) => {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);

	return (
		<div className="flex flex-col gap-3">
			{allMonths.map(({ year, month }) => (
				<MonthCard
					key={`${year}-${month}`}
					year={year}
					month={month}
					loans={loans}
					today={today}
					cal={cal}
					fa={fa}
					lang={lang}
					getPayment={getPayment}
					toggling={toggling}
					onToggle={handleToggle}
					isCollapsed={collapsed.has(`${year}-${month}`)}
					onToggleCollapse={toggleCollapse}
					curMonthRef={curMonthRef}
				/>
			))}
		</div>
	);
});

interface MonthCardProps {
	year: number;
	month: number;
	loans: Loan[];
	today: Today;
	cal: string;
	fa: boolean;
	lang: string;
	getPayment: (loanId: string, year: number, month: number) => Payment | null;
	toggling: string | null;
	onToggle: (
		loanId: string,
		year: number,
		month: number,
		paid: boolean,
	) => Promise<void>;
	isCollapsed: boolean;
	onToggleCollapse: (key: string) => void;
	curMonthRef: React.RefObject<HTMLDivElement | null>;
}

const MonthCard = memo(function MonthCard({
	year,
	month,
	loans,
	today,
	cal,
	fa,
	lang,
	getPayment,
	toggling,
	onToggle,
	isCollapsed,
	onToggleCollapse,
	curMonthRef,
}: MonthCardProps) {
	const monthTotal = year * 12 + month - 1;
	const curTotal = today.year * 12 + today.month - 1;

	const isCurrent = isCurrentMonth(year, month, cal as "gregorian" | "jalali");
	const isPast = (() => {
		if (cal === "jalali") {
			const cardJ = toJalali(year, month, 15);
			const nowJ = toJalali(today.year, today.month, today.day);
			return cardJ.year * 12 + cardJ.month < nowJ.year * 12 + nowJ.month;
		}
		return monthTotal < curTotal;
	})();

	const colKey = `${year}-${month}`;

	const todayDispDay =
		cal === "jalali"
			? toJalali(today.year, today.month, today.day).day
			: today.day;

	const monthLoans = useMemo(
		() =>
			loans.filter((l) => {
				const startTotal = l.startYear * 12 + l.startMonth - 1;
				if (monthTotal < startTotal) return false;
				if (l.installments) {
					const endTotal = startTotal + l.installments - 1;
					if (monthTotal > endTotal) return false;
				}
				return true;
			}),
		[loans, monthTotal],
	);

	// Totals per currency
	const totals = useMemo(() => {
		const t: Record<string, { total: number; paidAmt: number }> = {};
		for (const l of monthLoans) {
			const p = getPayment(l.id, year, month);
			if (!t[l.currency]) t[l.currency] = { total: 0, paidAmt: 0 };
			t[l.currency].total += l.amount;
			if (p?.paid) t[l.currency].paidAmt += l.amount;
		}
		return t;
	}, [monthLoans, getPayment, year, month]);

	const allLoansPaid =
		monthLoans.length > 0 &&
		monthLoans.every((l) => getPayment(l.id, year, month)?.paid);

	// Hide fully-paid past months
	if (isPast && allLoansPaid && !isCurrent) return null;

	const visibleLoans = isCollapsed
		? []
		: isPast
			? monthLoans.filter((l) => !getPayment(l.id, year, month)?.paid)
			: monthLoans;

	const monthLabel = getMonthLabel(year, month, cal as "gregorian" | "jalali");

	const totalPaidCount = monthLoans.filter(
		(l) => getPayment(l.id, year, month)?.paid,
	).length;
	const allDone = totalPaidCount === monthLoans.length && monthLoans.length > 0;

	return (
		<div
			ref={isCurrent ? curMonthRef : undefined}
			className={cn(
				"rounded-2xl overflow-hidden transition-shadow",
				isCurrent
					? "shadow-md ring-1 ring-zinc-900/8 dark:ring-white/8 bg-white dark:bg-zinc-900"
					: "bg-white dark:bg-zinc-900 ring-1 ring-zinc-100 dark:ring-zinc-800",
			)}
		>
			{/* Top accent bar */}
			{isCurrent && (
				<div className="h-1 bg-gradient-to-r from-zinc-700 via-zinc-900 to-zinc-700 dark:from-zinc-300 dark:via-white dark:to-zinc-300" />
			)}

			{/* Header */}
			<button
				type="button"
				onClick={() => onToggleCollapse(colKey)}
				className="w-full px-4 py-4 text-start bg-white dark:bg-zinc-900"
			>
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2.5 min-w-0">
						{/* Month dot indicator */}
						{isCurrent && (
							<span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white shrink-0" />
						)}
						<span
							className={cn(
								"font-semibold text-sm truncate",
								isCurrent
									? "text-zinc-900 dark:text-white"
									: isPast
										? "text-zinc-500 dark:text-zinc-400"
										: "text-zinc-700 dark:text-zinc-200",
								fa && "font-[family-name:var(--font-vazirmatn)]",
							)}
						>
							{monthLabel}
						</span>
						{isCurrent && (
							<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium shrink-0">
								{fa ? "امروز" : "now"}
							</span>
						)}
					</div>

					<div className="flex items-center gap-2.5 shrink-0">
						{/* Amount badges per currency */}
						{Object.entries(totals).map(([cur, { total, paidAmt }]) => {
							const rem = total - paidAmt;
							return (
								<span
									key={cur}
									className={cn(
										"text-xs tabular-nums font-medium",
										rem === 0
											? "text-emerald-500 dark:text-emerald-400"
											: isPast
												? "text-red-500 dark:text-red-400"
												: isCurrent
													? "text-zinc-700 dark:text-zinc-200 font-semibold"
													: "text-zinc-400 dark:text-zinc-500",
									)}
								>
									{rem === 0
										? `✓ ${fa ? "پرداخت شد" : "done"}`
										: `${rem.toLocaleString()} ${cur}`}
								</span>
							);
						})}

						{/* Progress pill */}
						{monthLoans.length > 1 && (
							<span
								className={cn(
									"text-[10px] tabular-nums px-1.5 py-0.5 rounded-full font-medium",
									allDone
										? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
										: "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500",
								)}
							>
								{totalPaidCount}/{monthLoans.length}
							</span>
						)}

						<svg
							width="10"
							height="10"
							viewBox="0 0 12 12"
							fill="currentColor"
							aria-hidden="true"
							className={cn(
								"transition-transform duration-200 text-zinc-300 dark:text-zinc-600 shrink-0",
								isCollapsed ? "-rotate-90" : "rotate-0",
							)}
						>
							<path d="M6 8L1 3h10L6 8z" />
						</svg>
					</div>
				</div>

				{/* Progress bar */}
				{Object.entries(totals).map(([cur, { total, paidAmt }]) => (
					<div
						key={cur}
						className="mt-3 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden"
					>
						<div
							className={cn(
								"h-full rounded-full transition-[width] duration-500",
								allDone
									? "bg-emerald-500 dark:bg-emerald-400"
									: isCurrent
										? "bg-zinc-700 dark:bg-zinc-300"
										: "bg-zinc-300 dark:bg-zinc-600",
							)}
							style={{
								width: total > 0 ? `${(paidAmt / total) * 100}%` : "0%",
							}}
						/>
					</div>
				))}
			</button>

			{/* Loans list */}
			<div
				className={cn(
					"grid transition-[grid-template-rows] duration-200 ease-in-out",
					isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
				)}
			>
				<div className="overflow-hidden min-h-0">
					{visibleLoans.length > 0 && (
						<div className="border-t border-zinc-50 dark:border-zinc-800">
							{visibleLoans.map((loan, lIdx) => {
								const payment = getPayment(loan.id, year, month);
								const paid = payment?.paid ?? false;
								const key = `${loan.id}-${year}-${month}`;
								const isLoading = toggling === key;
								const isOverdue =
									isCurrent && !paid && todayDispDay > loan.dueDay;
								const isFuture = (() => {
									if (cal === "jalali") {
										const cardJ = toJalali(year, month, 15);
										const nowJ = toJalali(today.year, today.month, today.day);
										return (
											cardJ.year * 12 + cardJ.month >
											nowJ.year * 12 + nowJ.month
										);
									}
									return monthTotal > curTotal;
								})();

								const installStart = loan.startYear * 12 + loan.startMonth - 1;
								const installNum = monthTotal - installStart + 1;

								const jInfo =
									cal === "jalali" ? toJalali(year, month, 15) : null;
								const jalaliMonth = jInfo?.month ?? 1;

								const dueDateLabel =
									cal === "jalali"
										? fa
											? `${loan.dueDay} ${JALALI_MONTHS[jalaliMonth - 1]}`
											: `${JALALI_MONTHS[jalaliMonth - 1]} ${loan.dueDay}`
										: `${GREGORIAN_MONTHS[month - 1].slice(0, 3)} ${loan.dueDay}`;

								const gDue =
									cal === "jalali" && jInfo
										? fromJalali(jInfo.year, jInfo.month, loan.dueDay)
										: { year, month, day: loan.dueDay };
								const dueMs = new Date(
									gDue.year,
									gDue.month - 1,
									gDue.day,
								).getTime();
								const todayMs = new Date(
									today.year,
									today.month - 1,
									today.day,
								).getTime();
								const daysLeft = Math.round((dueMs - todayMs) / 86400000);

								type Status =
									| "paid"
									| "overdue"
									| "today"
									| "soon"
									| "future"
									| "past";
								const status: Status = paid
									? "paid"
									: isPast
										? "past"
										: isOverdue
											? "overdue"
											: daysLeft === 0
												? "today"
												: isFuture
													? "future"
													: "soon";

								const countdownText = (() => {
									if (status === "paid")
										return paid && payment?.paidAt
											? new Date(payment.paidAt).toLocaleDateString(
													lang === "fa" ? "fa-IR" : "en-US",
													{ month: "short", day: "numeric" },
												)
											: fa
												? "پرداخت شد"
												: "paid";
									if (status === "overdue")
										return fa
											? `${Math.abs(daysLeft)} روز تأخیر`
											: `${Math.abs(daysLeft)}d late`;
									if (status === "today") return fa ? "امروز" : "today";
									if (status === "soon")
										return fa ? `${daysLeft} روز` : `${daysLeft}d`;
									return null;
								})();

								const statusBadgeStyle: Record<Status, string> = {
									paid: "text-zinc-300 dark:text-zinc-600",
									past: "text-zinc-400 dark:text-zinc-500",
									overdue:
										"bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full",
									today:
										"bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full",
									soon: "text-amber-500 dark:text-amber-400",
									future: "text-zinc-300 dark:text-zinc-600",
								};

								return (
									<div
										key={loan.id}
										className={cn(
											"flex items-center gap-3 px-4 py-3.5 transition-colors",
											lIdx > 0 &&
												"border-t border-zinc-50 dark:border-zinc-800/60",
											paid && "opacity-40",
										)}
									>
										{/* Color dot + checkbox */}
										<div className="relative shrink-0">
											<button
												type="button"
												onClick={() =>
													void onToggle(loan.id, year, month, !paid)
												}
												disabled={isLoading}
												className={cn(
													"w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
													paid
														? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
														: isFuture
															? "border-zinc-200 dark:border-zinc-700"
															: isOverdue
																? "border-red-300 dark:border-red-600 hover:border-red-500"
																: "border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-400",
												)}
											>
												{isLoading ? (
													<span className="w-2 h-2 rounded-full border border-zinc-300 border-t-zinc-700 dark:border-t-white animate-spin" />
												) : paid ? (
													<Check
														className="w-3 h-3 text-white dark:text-zinc-900"
														strokeWidth={3}
													/>
												) : null}
											</button>
											{/* loan color accent dot */}
											{!paid && (
												<span
													className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-zinc-900"
													style={{ backgroundColor: loanColor(loan.id) }}
												/>
											)}
										</div>

										{/* Name + meta */}
										<Link
											href={`/loans/${loan.id}`}
											className="flex-1 min-w-0 group"
										>
											<p
												className={cn(
													"text-sm font-medium leading-tight truncate transition-colors",
													paid
														? "line-through text-zinc-300 dark:text-zinc-600"
														: isOverdue
															? "text-red-600 dark:text-red-400"
															: "text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300",
												)}
											>
												{loan.name}
											</p>
											<p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 tabular-nums flex items-center gap-1">
												<span>
													{loan.amount.toLocaleString()} {loan.currency}
												</span>
												{loan.installments && (
													<span className="opacity-50">
														· {installNum}/{loan.installments}
													</span>
												)}
											</p>
										</Link>

										{/* Right column: status + due date + pay link */}
										<div className="text-end shrink-0 flex flex-col items-end gap-1">
											{countdownText && (
												<span
													className={cn(
														"text-xs font-semibold tabular-nums leading-none",
														statusBadgeStyle[status],
													)}
												>
													{countdownText}
												</span>
											)}
											<div className="flex items-center gap-1">
												<span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
													{dueDateLabel}
												</span>
												{loan.paymentUrl && !paid && (
													<a
														href={loan.paymentUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="text-zinc-300 dark:text-zinc-600 hover:text-blue-500 dark:hover:text-blue-400 transition"
														title={fa ? "پرداخت" : "Pay"}
													>
														<ExternalLink className="w-3 h-3" />
													</a>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{/* Past month with all paid — compact done row */}
					{!isCollapsed &&
						isPast &&
						visibleLoans.length === 0 &&
						monthLoans.length > 0 && (
							<div className="border-t border-zinc-50 dark:border-zinc-800 px-4 py-2.5 flex items-center gap-2">
								<Check
									className="w-3.5 h-3.5 text-emerald-500"
									strokeWidth={2.5}
								/>
								<span className="text-xs text-zinc-400 dark:text-zinc-500">
									{fa ? "همه پرداخت‌ها انجام شده" : "All payments done"}
								</span>
							</div>
						)}
				</div>
			</div>
		</div>
	);
});

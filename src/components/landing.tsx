"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Check, CalendarDays, Bell, Globe, ChevronRight, ArrowRight } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const FEATURES = [
	{
		icon: <Check className="w-5 h-5" />,
		title: "Track installments",
		desc: "Mark each month's payment paid with one tap. See exactly what's left at a glance.",
	},
	{
		icon: <CalendarDays className="w-5 h-5" />,
		title: "Calendar view",
		desc: "See all due dates on a calendar. Jalali and Gregorian supported.",
	},
	{
		icon: <Bell className="w-5 h-5" />,
		title: "Reminders",
		desc: "Never miss a due date. Get notified before payments are due.",
	},
	{
		icon: <Globe className="w-5 h-5" />,
		title: "Multi-currency",
		desc: "IRR, USD, EUR, AED and more. Works for any loan in any currency.",
	},
];

const DEMO_LOANS = [
	{ name: "Car loan", amount: "2,400,000", currency: "IRR", dueDay: 5, paid: true, color: "#3b82f6" },
	{ name: "Mortgage", amount: "1,800", currency: "USD", dueDay: 15, paid: false, color: "#a855f7", overdue: true },
	{ name: "Phone", amount: "320", currency: "USD", dueDay: 22, paid: false, color: "#22c55e" },
];

function DemoCard() {
	return (
		<div className="w-full max-w-sm mx-auto rounded-3xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-100 dark:ring-zinc-800 shadow-2xl overflow-hidden select-none">
			{/* Header */}
			<div className="px-5 pt-5 pb-4 border-b border-zinc-50 dark:border-zinc-800">
				<div className="flex items-center justify-between">
					<div>
						<span className="text-xl font-black tracking-[-0.04em] text-zinc-900 dark:text-white">qist</span>
						<p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Jun 27, 2026</p>
					</div>
					<div className="text-right">
						<p className="text-[11px] text-zinc-400 dark:text-zinc-500">this month</p>
						<p className="text-sm font-semibold text-red-500 dark:text-red-400">$2,120 left</p>
					</div>
				</div>
				{/* mini progress */}
				<div className="mt-3 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
					<div className="h-full w-1/3 bg-zinc-400 dark:bg-zinc-500 rounded-full" />
				</div>
			</div>

			{/* Month card */}
			<div className="px-5 pt-4 pb-2">
				<div className="flex items-center gap-2 mb-3">
					<span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white" />
					<span className="text-sm font-semibold text-zinc-900 dark:text-white">June 2026</span>
					<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">now</span>
				</div>

				<div className="flex flex-col divide-y divide-zinc-50 dark:divide-zinc-800">
					{DEMO_LOANS.map((loan) => (
						<div key={loan.name} className="flex items-center gap-3 py-2.5">
							<div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${loan.paid ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white" : loan.overdue ? "border-red-400" : "border-zinc-300 dark:border-zinc-600"}`}>
								{loan.paid && <Check className="w-3 h-3 text-white dark:text-zinc-900" strokeWidth={3} />}
							</div>
							<div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: loan.paid ? "#d4d4d8" : loan.color }} />
							<div className="flex-1 min-w-0">
								<p className={`text-sm font-medium ${loan.paid ? "line-through text-zinc-400" : "text-zinc-900 dark:text-white"}`}>{loan.name}</p>
								<p className="text-[11px] text-zinc-400 tabular-nums">Day {loan.dueDay} · {loan.amount} {loan.currency}</p>
							</div>
							{loan.overdue && <span className="text-[11px] text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">2d late</span>}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function Landing() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => { setMounted(true); }, []);

	return (
		<div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
			{/* Nav */}
			<nav className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
				<div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
					<span className="text-lg font-black tracking-[-0.04em]">qist</span>
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-xl transition">
							Sign in
						</Link>
						<Link href="/register" className="text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-1.5 rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-200 transition">
							Get started
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero */}
			<section className="flex-1 flex flex-col items-center justify-center px-6 py-20 md:py-32 text-center relative overflow-hidden">
				{/* Background decoration */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-zinc-900/[0.02] dark:bg-white/[0.02] blur-3xl" />
				</div>

				<div className="relative z-10 max-w-2xl mx-auto">
					<div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
						Minimal · Private · Free
					</div>

					<h1 className="text-5xl md:text-7xl font-black tracking-[-0.04em] leading-[0.95] mb-6">
						Never miss
						<br />
						<span className="text-zinc-400 dark:text-zinc-500">a payment.</span>
					</h1>

					<p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-10 leading-relaxed">
						Track loans, installments, and recurring payments. See what you owe this month, mark them paid, move on.
					</p>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<Link
							href="/register"
							className="group flex items-center gap-2 px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-semibold text-sm hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all hover:gap-3"
						>
							Start for free
							<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
						</Link>
						<Link href="/login" className="flex items-center gap-1 px-6 py-3.5 rounded-2xl text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition">
							Sign in <ChevronRight className="w-4 h-4" />
						</Link>
					</div>
				</div>

				{/* Demo card */}
				<div
					className={`mt-20 w-full max-w-sm mx-auto transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
					style={{ transitionDelay: "200ms" }}
				>
					<DemoCard />
				</div>
			</section>

			{/* Features */}
			<section className="py-20 px-6 border-t border-zinc-100 dark:border-zinc-900">
				<div className="max-w-5xl mx-auto">
					<h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-12 text-center">
						Everything you need
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
						{FEATURES.map((f) => (
							<div key={f.title} className="rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-100 dark:ring-zinc-800 p-5">
								<div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-4">
									{f.icon}
								</div>
								<h3 className="font-semibold text-sm text-zinc-900 dark:text-white mb-1">{f.title}</h3>
								<p className="text-sm text-zinc-400 dark:text-zinc-500 leading-relaxed">{f.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA footer */}
			<section className="py-20 px-6 border-t border-zinc-100 dark:border-zinc-900 text-center">
				<h2 className="text-3xl font-black tracking-tight mb-4">Ready to start?</h2>
				<p className="text-zinc-400 dark:text-zinc-500 mb-8 text-sm">No credit card. No ads. Just your loans.</p>
				<Link
					href="/register"
					className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-semibold text-sm hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
				>
					Create account
					<ArrowRight className="w-4 h-4" />
				</Link>
			</section>

			{/* Footer */}
			<footer className="border-t border-zinc-100 dark:border-zinc-900 py-8 px-6">
				<div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
					<span className="font-black text-sm text-zinc-900 dark:text-white">qist</span>
					<span>Track it. Pay it. Done.</span>
				</div>
			</footer>
		</div>
	);
}

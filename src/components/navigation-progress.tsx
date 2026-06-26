"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [progress, setProgress] = useState(0);
	const [visible, setVisible] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const rafRef = useRef<number | null>(null);

	// Start bar on link click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			const a = (e.target as Element).closest("a");
			if (!a) return;
			const href = a.getAttribute("href");
			if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#")) return;
			start();
		}
		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, []);

	// Complete bar when route finishes
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => { complete(); }, [pathname, searchParams]);

	function start() {
		if (timerRef.current) clearTimeout(timerRef.current);
		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		setProgress(0);
		setVisible(true);
		// trickle to 85%
		let p = 0;
		function trickle() {
			p += (85 - p) * 0.12;
			setProgress(Math.min(p, 85));
			timerRef.current = setTimeout(() => {
				rafRef.current = requestAnimationFrame(trickle);
			}, 200);
		}
		trickle();
	}

	function complete() {
		if (timerRef.current) clearTimeout(timerRef.current);
		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		setProgress(100);
		timerRef.current = setTimeout(() => setVisible(false), 300);
	}

	if (!visible) return null;

	return (
		<div
			className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
			aria-hidden="true"
		>
			<div
				className="h-full bg-zinc-900 dark:bg-white transition-[width] duration-200 ease-out"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
}

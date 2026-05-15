"use client";

import { cn } from "@/lib/cn";

type Props = {
  /** 0–100 */
  percent: number;
  variant?: "payment" | "debt" | "pending";
  className?: string;
};

export function ProgressTrack({ percent, variant = "debt", className }: Props) {
  const safe = Math.min(100, Math.max(0, percent));
  const tone =
    variant === "payment"
      ? "from-indigo-500/90 to-violet-400/90 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
      : variant === "pending"
        ? "from-amber-500/90 to-orange-400/90 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        : "from-emerald-500/90 to-teal-400/90 shadow-[0_0_20px_rgba(16,185,129,0.3)]";

  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800/90",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "progress-shine absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          tone,
        )}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

"use client";

import { LoaderCircle, Wallet } from "@/components/icons";
import { cn } from "@/lib/cn";

export function LedgerLoadingSplash() {
  return (
    <div
      className="flex min-h-dvh w-full flex-col items-center justify-center px-6 py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        <div
          className={cn(
            "relative flex size-16 items-center justify-center rounded-2xl border border-indigo-200/90 bg-white shadow-md",
            "dark:border-indigo-800/70 dark:bg-zinc-950",
          )}
        >
          <span
            className="absolute inset-0 rounded-2xl ring-2 ring-indigo-400/30 motion-safe:animate-pulse dark:ring-indigo-500/25"
            aria-hidden
          />
          <Wallet
            className="relative size-8 text-indigo-600 dark:text-indigo-400"
            strokeWidth={1.75}
            aria-hidden
          />
          <LoaderCircle
            className="absolute -bottom-1 -end-1 size-7 rounded-full bg-white p-0.5 text-violet-600 shadow-md dark:bg-zinc-950 dark:text-violet-400"
            strokeWidth={2}
            aria-hidden
          />
        </div>

        <p className="mt-8 text-center text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
          Loading your ledger
        </p>
        <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Fetching entries and contacts…
        </p>

        <div
          className="ledger-load-track mt-8 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800"
          aria-hidden
        >
          <div className="ledger-load-bar rounded-full bg-indigo-500 dark:bg-indigo-400" />
        </div>
      </div>
    </div>
  );
}

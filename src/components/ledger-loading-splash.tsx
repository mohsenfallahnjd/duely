"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Wallet } from "@/components/icons";
import { cn } from "@/lib/cn";

const SNARKS = [
  "Teaching the calculator to carry the one…",
  "Bribing rows in your spreadsheet with coffee…",
  "Untangling receipts from last Tuesday…",
  "Explaining compound interest to a rubber duck…",
  "Convincing pixels to behave like real money…",
  "Asking your future self if this expense was “worth it”…",
  "Loading ambition, fiscal responsibility, and mild panic…",
  "Consulting the ancient tome: “Ctrl+Z Finance Edition”…",
  "Your numbers are in the green room. Literally. They’re nervous.",
];

export function LedgerLoadingSplash() {
  /** Fixed initial line so SSR and the browser’s first paint match (no Math.random in useState). */
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const tick = window.setTimeout(() => {
      setMsgIndex(Math.floor(Math.random() * SNARKS.length));
    }, 0);
    const id = window.setInterval(() => {
      setMsgIndex((i) => (i + 1) % SNARKS.length);
    }, 2800);
    return () => {
      window.clearTimeout(tick);
      window.clearInterval(id);
    };
  }, []);

  return (
    <div
      className="flex min-h-[55vh] flex-col items-center justify-center gap-8 px-6 py-16"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="relative">
        <span
          className="absolute -inset-3 rounded-[28px] bg-gradient-to-tr from-indigo-500/25 via-violet-500/15 to-amber-400/20 blur-md dark:from-indigo-400/20 dark:via-violet-400/15"
          aria-hidden
        />
        <div
          className={cn(
            "relative flex size-[4.75rem] items-center justify-center rounded-[22px] border border-indigo-200/90 bg-white shadow-lg",
            "progress-shine dark:border-indigo-800/80 dark:bg-zinc-950",
          )}
        >
          <Wallet
            className="size-10 text-indigo-600 motion-safe:animate-bounce dark:text-indigo-400"
            style={{ animationDuration: "1.35s" }}
          />
        </div>
        <LoaderCircle
          className="absolute -bottom-2 -right-2 size-9 text-violet-500 drop-shadow-sm motion-safe:animate-spin dark:text-violet-400"
          strokeWidth={2.25}
          aria-hidden
        />
      </div>

      <div className="max-w-xs text-center sm:max-w-sm">
        <p className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
          Hang tight — ledger incoming
        </p>
        <p
          key={msgIndex}
          className="ledger-quip-in mt-3 min-h-[2.75rem] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
        >
          {SNARKS[msgIndex]}
        </p>
        <div
          className="mt-5 flex justify-center gap-1 motion-safe:opacity-90"
          aria-hidden
        >
          {[0, 1, 2].map((d) => (
            <span
              key={d}
              className="size-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-violet-400 motion-safe:animate-bounce dark:from-indigo-400 dark:to-violet-500"
              style={{
                animationDelay: `${d * 120}ms`,
                animationDuration: "0.65s",
              }}
            />
          ))}
        </div>
        <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
          (No money was harmed in the making of this loader)
        </p>
      </div>
    </div>
  );
}

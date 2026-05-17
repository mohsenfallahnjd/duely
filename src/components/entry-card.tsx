"use client";

import type { Entry } from "@/lib/types";
import { formatDatePersian } from "@/lib/format";
import { TomanAmount } from "@/components/toman-icon";
import { KIND_META } from "@/lib/constants";
import { isEntryFullySettled } from "@/lib/entry-helpers";
import { cn } from "@/lib/cn";
import { ProgressTrack } from "@/components/progress-track";
import { Check, CreditCard, Pencil, Tag, Trash2 } from "@/components/icons";
import type { Contact } from "@/lib/types";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const s =
    parts.length >= 2
      ? `${parts[0]![0]!}${parts[1]![0]!}`
      : (parts[0]?.slice(0, 2) ?? "?");
  return s.toUpperCase();
}

function percent(entry: Entry) {
  if (entry.amount <= 0) return 0;
  if (entry.kind === "payment") return 100;
  return Math.min(100, (entry.progressAmount / entry.amount) * 100);
}

type Props = {
  entry: Entry;
  contact: Contact | undefined;
  onEdit?: (entry: Entry) => void;
  onDelete: (id: string) => void | Promise<void>;
  onProgressChange: (id: string, value: number) => void | Promise<void>;
  /** When set, that tag chip is highlighted; chips are buttons if handler provided. */
  activeTag?: string | null;
  onTagClick?: (tag: string) => void;
};

export function EntryCard({
  entry,
  contact,
  onEdit,
  onDelete,
  onProgressChange,
  activeTag,
  onTagClick,
}: Props) {
  const remaining = Math.max(0, entry.amount - entry.progressAmount);
  const settled = isEntryFullySettled(entry);
  const variant =
    entry.kind === "payment"
      ? "payment"
      : entry.kind === "pending"
        ? "pending"
        : "debt";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-zinc-300/80 hover:shadow-md",
        "dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:hover:border-zinc-700",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                entry.kind === "payment" &&
                  "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
                entry.kind === "debt" &&
                  "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
                entry.kind === "pending" &&
                  "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
              )}
            >
              {KIND_META[entry.kind].label}
            </span>
            {settled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200">
                <Check className="size-3 stroke-[2.5]" aria-hidden />
                Settled
              </span>
            )}
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDatePersian(entry.date)}
            </span>
          </div>
          <h3 className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {entry.title}
          </h3>
        </div>
        <div className="flex shrink-0 items-start gap-0.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="rounded-lg p-2 text-zinc-500 opacity-100 transition-all hover:bg-zinc-100 hover:text-indigo-600 sm:opacity-0 sm:group-hover:opacity-100 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-indigo-400"
              aria-label="Edit entry"
            >
              <Pencil className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="rounded-lg p-2 text-zinc-500 opacity-100 transition-all hover:bg-zinc-100 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-red-400"
            aria-label="Delete entry"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            <TomanAmount
              value={entry.amount}
              className="text-2xl font-semibold tracking-tight"
            />
          </p>
          {entry.kind !== "payment" && (
            <p className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-zinc-500 dark:text-zinc-400">
              {entry.kind === "debt" ? (
                <>
                  <TomanAmount value={remaining} />
                  <span>left ·</span>
                  <TomanAmount value={entry.progressAmount} />
                  <span>paid</span>
                </>
              ) : (
                <>
                  <TomanAmount value={remaining} />
                  <span>remaining ·</span>
                  <TomanAmount value={entry.progressAmount} />
                  <span>settled</span>
                </>
              )}
            </p>
          )}
        </div>
        {contact && (
          <div className="flex items-center gap-2 rounded-xl bg-zinc-100/80 px-3 py-1.5 dark:bg-zinc-900/80">
            <span
              className="flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: contact.accent }}
            >
              {initials(contact.name)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="max-w-[140px] truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {contact.name}
              </span>
              {contact.phone && (
                <span
                  className="max-w-[160px] truncate text-[11px] text-zinc-500 dark:text-zinc-400"
                  dir="ltr"
                >
                  {contact.phone}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {entry.kind !== "payment" && (
          <>
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                {entry.kind === "debt"
                  ? "Payoff progress"
                  : "Settlement progress"}
              </span>
              <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                {Math.round(percent(entry))}%
              </span>
            </div>
            <ProgressTrack percent={percent(entry)} variant={variant} />
            {settled ? (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5",
                  "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    "bg-emerald-600 text-white dark:bg-emerald-500",
                  )}
                >
                  <Check className="size-4" strokeWidth={2.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-950 dark:text-emerald-100">
                    Fully settled
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-emerald-800/90 dark:text-emerald-300/90">
                    {entry.kind === "debt"
                      ? "Marked as paid off. Adjust the slider below if you need to change it."
                      : "Marked as fully received. Adjust the slider below if you need to change it."}
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void onProgressChange(entry.id, entry.amount)
                }
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  "border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm",
                  "hover:border-emerald-300 hover:bg-emerald-100/90 active:scale-[0.99]",
                  "dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-950/70",
                )}
              >
                <Check className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
                {entry.kind === "debt"
                  ? "Mark paid off"
                  : "Mark fully received"}
              </button>
            )}
          </>
        )}
        {entry.kind !== "payment" && (
          <label className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <CreditCard className="size-3.5 shrink-0" />
            <span className="shrink-0">Adjust paid/settled</span>
            <input
              type="range"
              min={0}
              max={entry.amount}
              step="0.01"
              value={entry.progressAmount}
              onChange={(e) =>
                onProgressChange(entry.id, Number(e.target.value))
              }
              className="h-1.5 w-full flex-1 cursor-pointer accent-indigo-600 dark:accent-indigo-400"
            />
          </label>
        )}
      </div>

      {entry.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entry.tags.map((t) => {
            const isActive = activeTag === t;
            const clickable = Boolean(onTagClick);
            const className = cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition",
              isActive
                ? "bg-indigo-200 text-indigo-950 ring-1 ring-indigo-400/70 dark:bg-indigo-950/80 dark:text-indigo-100 dark:ring-indigo-500/50"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
              clickable &&
                "cursor-pointer hover:bg-indigo-100 hover:ring-1 hover:ring-indigo-300/60 dark:hover:bg-indigo-950/50 dark:hover:ring-indigo-500/40",
            );
            if (clickable) {
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTagClick!(t)}
                  className={className}
                >
                  <Tag className="size-3 opacity-60" />
                  {t}
                </button>
              );
            }
            return (
              <span key={t} className={className}>
                <Tag className="size-3 opacity-60" />
                {t}
              </span>
            );
          })}
        </div>
      )}

      {entry.note && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {entry.note}
        </p>
      )}
    </article>
  );
}

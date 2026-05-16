"use client";

import type { ReactNode } from "react";
import { usePayLedger } from "@/components/pay-ledger-provider";
import {
  AlertCircle,
  Check,
  Cloud,
  CloudOff,
  LoaderCircle,
  RefreshCw,
} from "@/components/icons";
import { cn } from "@/lib/cn";

/** Compact online / sync status for the list view (and signed-out cloud hint). */
export function SyncStatusBanner() {
  const {
    syncEnabled,
    user,
    networkOnline,
    pendingOutboxCount,
    syncBusy,
    syncError,
    resync,
  } = usePayLedger();

  if (!syncEnabled) return null;

  if (!user) {
    return (
      <div
        className={cn(
          "mb-3 flex items-start gap-2 rounded-xl border px-3 py-2.5",
          "border-zinc-200/90 bg-zinc-50/90 text-[11px] leading-snug text-zinc-600",
          "dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400",
        )}
      >
        <Cloud
          className="mt-px size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
          strokeWidth={2}
          aria-hidden
        />
        <p>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            Cloud sync
          </span>
          <span className="text-zinc-500 dark:text-zinc-500"> · </span>
          Open{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            More
          </span>{" "}
          and sign in to save your ledger to the server.
        </p>
      </div>
    );
  }

  const variant = !networkOnline
    ? "offline"
    : syncError
      ? "error"
      : syncBusy || pendingOutboxCount > 0
        ? "busy"
        : "ok";

  const shell = {
    offline:
      "border-amber-200/90 bg-amber-50/90 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100",
    error:
      "border-rose-200/90 bg-rose-50/90 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100",
    busy:
      "border-sky-200/90 bg-sky-50/90 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-100",
    ok:
      "border-emerald-200/80 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/45 dark:bg-emerald-950/30 dark:text-emerald-100",
  }[variant];

  const canRetry = networkOnline && Boolean(syncError) && !syncBusy;

  const showSyncSpinner = networkOnline && syncBusy;

  let leadingIcon: ReactNode = null;
  if (!networkOnline) {
    leadingIcon = (
      <CloudOff
        className="mt-px size-4 shrink-0 opacity-90"
        strokeWidth={2}
        aria-hidden
      />
    );
  } else if (variant === "error") {
    leadingIcon = (
      <AlertCircle
        className="mt-px size-4 shrink-0 opacity-90"
        strokeWidth={2}
        aria-hidden
      />
    );
  } else if (showSyncSpinner) {
    leadingIcon = (
      <LoaderCircle
        className="mt-px size-4 shrink-0 animate-spin opacity-90"
        strokeWidth={2}
        aria-hidden
      />
    );
  } else if (variant === "busy") {
    leadingIcon = (
      <Cloud
        className="mt-px size-4 shrink-0 opacity-90"
        strokeWidth={2}
        aria-hidden
      />
    );
  } else if (variant === "ok") {
    leadingIcon = (
      <Check
        className="mt-px size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
        strokeWidth={2.5}
        aria-hidden
      />
    );
  }

  const title =
    variant === "offline"
      ? "Offline"
      : variant === "error"
        ? "Sync issue"
        : variant === "busy"
          ? syncBusy
            ? "Syncing…"
            : pendingOutboxCount > 0
              ? `${pendingOutboxCount} change${pendingOutboxCount === 1 ? "" : "s"} queued`
              : "Syncing…"
          : "Online";

  const detail =
    variant === "offline"
      ? pendingOutboxCount > 0
        ? `Saved on device · ${pendingOutboxCount} waiting to upload`
        : "Saved on this device · will upload when back online"
      : variant === "error"
        ? syncError
        : variant === "busy"
          ? syncBusy
            ? "Sending your latest edits to the server"
            : "Waiting to sync · tap Sync if nothing happens"
          : "All changes saved to the server";

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border px-3 py-2.5 shadow-sm",
        shell,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {leadingIcon}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold leading-tight sm:text-xs">
            {title}
            {variant === "ok" && (
              <span className="font-normal opacity-80"> · Synced</span>
            )}
          </p>
          <p
            className="mt-0.5 max-w-[min(100%,28rem)] text-[11px] leading-snug opacity-90 sm:text-xs"
            title={variant === "error" && syncError ? syncError : undefined}
          >
            {detail}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {canRetry && (
          <button
            type="button"
            onClick={() => void resync()}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-300/80 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-rose-900 transition hover:bg-white dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-100 dark:hover:bg-rose-950"
          >
            <RefreshCw className="size-3" />
            Retry
          </button>
        )}
        {variant === "busy" && !syncBusy && pendingOutboxCount > 0 && (
          <button
            type="button"
            onClick={() => void resync()}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-sky-300/80 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-sky-950 transition hover:bg-white dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100 dark:hover:bg-sky-950"
          >
            <RefreshCw className="size-3" />
            Sync now
          </button>
        )}
      </div>
    </div>
  );
}

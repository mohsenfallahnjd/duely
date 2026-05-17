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

function BadgeShell({
  variant,
  title,
  children,
}: {
  variant: "neutral" | "ok" | "offline" | "busy" | "error";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    neutral:
      "border-zinc-200/80 bg-zinc-50/90 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400",
    ok:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100",
    offline:
      "border-amber-400/35 bg-amber-500/10 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
    busy:
      "border-sky-400/35 bg-sky-500/10 text-sky-950 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100",
    error:
      "border-rose-400/35 bg-rose-500/10 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-tight sm:text-[11px]",
        styles,
      )}
      title={title}
    >
      {children}
    </span>
  );
}

/** Minimal online / sync badge for the list view. */
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
      <div className="mb-2">
        <BadgeShell
          variant="neutral"
          title="Open More and sign in to save your ledger to the server."
        >
          <Cloud className="size-3 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          <span className="truncate">Local · Sign in to sync</span>
        </BadgeShell>
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

  const canRetry = networkOnline && Boolean(syncError) && !syncBusy;
  const showSyncSpinner = networkOnline && syncBusy;
  const showSyncNow =
    variant === "busy" && !syncBusy && pendingOutboxCount > 0;

  let icon: ReactNode = null;
  let badgeVariant: "ok" | "offline" | "busy" | "error" = "ok";
  let shortLabel = "";
  let tooltip = "";

  if (!networkOnline) {
    badgeVariant = "offline";
    icon = (
      <CloudOff className="size-3 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
    );
    shortLabel = "Offline";
    tooltip =
      pendingOutboxCount > 0
        ? `Saved on this device. ${pendingOutboxCount} change${pendingOutboxCount === 1 ? "" : "s"} will upload when you’re back online.`
        : "Saved on this device. Changes will upload when you’re back online.";
  } else if (variant === "error") {
    badgeVariant = "error";
    icon = (
      <AlertCircle className="size-3 shrink-0" strokeWidth={2} aria-hidden />
    );
    shortLabel = "Sync error";
    tooltip = syncError ?? "Sync failed.";
  } else if (showSyncSpinner) {
    badgeVariant = "busy";
    icon = (
      <LoaderCircle
        className="size-3 shrink-0 animate-spin opacity-90"
        strokeWidth={2}
        aria-hidden
      />
    );
    shortLabel = "Syncing";
    tooltip = "Sending your latest edits to the server.";
  } else if (variant === "busy") {
    badgeVariant = "busy";
    icon = (
      <Cloud className="size-3 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
    );
    shortLabel =
      pendingOutboxCount > 0
        ? `${pendingOutboxCount} queued`
        : "Sync";
    tooltip =
      pendingOutboxCount > 0
        ? `${pendingOutboxCount} change${pendingOutboxCount === 1 ? "" : "s"} waiting to upload. Use refresh if nothing happens.`
        : "Waiting to sync.";
  } else {
    badgeVariant = "ok";
    icon = (
      <Check
        className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400"
        strokeWidth={2.75}
        aria-hidden
      />
    );
    shortLabel = "Synced";
    tooltip = "Online — all changes saved to the server.";
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      <BadgeShell variant={badgeVariant} title={tooltip}>
        {icon}
        <span className="min-w-0 truncate">{shortLabel}</span>
      </BadgeShell>

      {canRetry && (
        <button
          type="button"
          onClick={() => void resync()}
          title={syncError ?? "Retry sync"}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-full border border-rose-300/60 bg-white/90 text-rose-800 shadow-sm transition",
            "hover:bg-white active:scale-95 dark:border-rose-800/80 dark:bg-rose-950/50 dark:text-rose-100 dark:hover:bg-rose-950/70",
          )}
          aria-label="Retry sync"
        >
          <RefreshCw className="size-3.5" strokeWidth={2} />
        </button>
      )}
      {showSyncNow && (
        <button
          type="button"
          onClick={() => void resync()}
          title="Upload queued changes now"
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-full border border-sky-300/60 bg-white/90 text-sky-900 shadow-sm transition",
            "hover:bg-white active:scale-95 dark:border-sky-800/80 dark:bg-sky-950/50 dark:text-sky-100 dark:hover:bg-sky-950/70",
          )}
          aria-label="Sync now"
        >
          <RefreshCw className="size-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

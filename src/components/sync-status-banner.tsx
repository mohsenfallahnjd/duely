"use client";

import { usePayLedger } from "@/components/pay-ledger-provider";
import { Cloud, CloudOff, LoaderCircle, RefreshCw } from "@/components/icons";
import { cn } from "@/lib/cn";

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

  if (!syncEnabled || !user) return null;

  const variant = !networkOnline
    ? "offline"
    : syncError
      ? "error"
      : syncBusy || pendingOutboxCount > 0
        ? "busy"
        : "ok";

  const shell = {
    offline:
      "border-amber-300/80 bg-amber-50/95 text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-100",
    error:
      "border-rose-300/80 bg-rose-50/95 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/45 dark:text-rose-100",
    busy: "border-sky-300/80 bg-sky-50/95 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/45 dark:text-sky-100",
    ok: "border-emerald-200/80 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-100",
  }[variant];

  const canRetry = networkOnline && Boolean(syncError) && !syncBusy;

  const showSyncSpinner =
    networkOnline && syncBusy && (pendingOutboxCount > 0 || variant === "busy");

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2 rounded-2xl border px-3.5 py-3 text-xs leading-snug sm:flex-row sm:items-center sm:justify-between",
        shell,
      )}
    >
      <div className="flex items-start gap-2 sm:items-center">
        {!networkOnline ? (
          <CloudOff className="mt-0.5 size-4 shrink-0 opacity-80 sm:mt-0" />
        ) : showSyncSpinner ? (
          <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin opacity-80 sm:mt-0" />
        ) : (
          <Cloud className="mt-0.5 size-4 shrink-0 opacity-80 sm:mt-0" />
        )}
        <div className="space-y-0.5">
          {variant === "offline" && (
            <>
              <p className="font-medium">Offline</p>
              <p className="opacity-90">
                Changes are saved on this device. They will sync to the
                database when you are back online.
                {pendingOutboxCount > 0
                  ? ` (${pendingOutboxCount} pending)`
                  : ""}
              </p>
            </>
          )}
          {variant === "error" && (
            <>
              <p className="font-medium">Sync error</p>
              <p className="opacity-90">{syncError}</p>
            </>
          )}
          {variant === "busy" && networkOnline && (
            <>
              <p className="font-medium">
                {syncBusy
                  ? "Syncing with server…"
                  : `${pendingOutboxCount} change${pendingOutboxCount === 1 ? "" : "s"} queued`}
              </p>
              {!syncBusy && pendingOutboxCount > 0 && (
                <p className="opacity-90">
                  Sync should start shortly. If it stalls, use Retry below.
                </p>
              )}
            </>
          )}
          {variant === "ok" && (
            <p className="font-medium">Online — in sync with database</p>
          )}
        </div>
      </div>

      {canRetry && (
        <button
          type="button"
          onClick={() => void resync()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-400/60 bg-white/80 px-3 py-1.5 text-xs font-semibold text-rose-900 shadow-sm transition hover:bg-white dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100 dark:hover:bg-rose-950"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </button>
      )}
      {variant === "busy" && !syncBusy && pendingOutboxCount > 0 && (
        <button
          type="button"
          onClick={() => void resync()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-sky-400/60 bg-white/80 px-3 py-1.5 text-xs font-semibold text-sky-950 shadow-sm transition hover:bg-white dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-100 dark:hover:bg-sky-950"
        >
          <RefreshCw className="size-3.5" />
          Sync now
        </button>
      )}
    </div>
  );
}

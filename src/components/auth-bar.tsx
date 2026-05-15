"use client";

import { usePayLedger } from "@/components/pay-ledger-provider";
import { Link } from "@/components/link";
import { LogIn, LogOut, UserPlus } from "@/components/icons";
import { cn } from "@/lib/cn";

const btn =
  "inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900";

const primary =
  "inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500";

export function AuthBar() {
  const {
    syncEnabled,
    user,
    networkOnline,
    pendingOutboxCount,
    syncBusy,
    syncError,
    signOut,
  } = usePayLedger();

  if (!syncEnabled) {
    return (
      <p
        className={cn(
          "rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-xs leading-relaxed text-amber-950",
          "dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-100",
        )}
      >
        Cloud sync is off (set{" "}
        <code className="rounded bg-white/60 px-1 dark:bg-black/30">
          NEXT_PUBLIC_CLOUD_SYNC
        </code>{" "}
        to enable). When enabled, add{" "}
        <code className="rounded bg-white/60 px-1 dark:bg-black/30">
          DATABASE_URL
        </code>{" "}
        (Neon Postgres) and{" "}
        <code className="rounded bg-white/60 px-1 dark:bg-black/30">
          AUTH_SECRET
        </code>{" "}
        to{" "}
        <code className="rounded bg-white/60 px-1 dark:bg-black/30">
          .env.local
        </code>
        , then run{" "}
        <code className="rounded bg-white/60 px-1 dark:bg-black/30">
          bun run db:push
        </code>
        .
      </p>
    );
  }

  if (user) {
    const syncHint = !networkOnline
      ? "Offline — changes queue on device"
      : syncError
        ? "Sync error"
        : syncBusy || pendingOutboxCount > 0
          ? pendingOutboxCount > 0
            ? `Syncing (${pendingOutboxCount} pending)`
            : "Syncing…"
          : "Synced";

    return (
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 sm:text-right">
          <span
            className={cn(
              "font-medium",
              !networkOnline && "text-amber-700 dark:text-amber-400",
              networkOnline && syncError && "text-rose-700 dark:text-rose-400",
              networkOnline &&
                !syncError &&
                (syncBusy || pendingOutboxCount > 0) &&
                "text-sky-700 dark:text-sky-400",
              networkOnline &&
                !syncError &&
                !syncBusy &&
                pendingOutboxCount === 0 &&
                "text-emerald-700 dark:text-emerald-400",
            )}
          >
            {syncHint}
          </span>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
          <span className="max-w-[220px] truncate align-bottom">
            {user.email}
          </span>
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className={cn(btn, "justify-center")}
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link href="/login" className={cn(btn, "justify-center")}>
        <LogIn className="size-3.5" />
        Log in
      </Link>
      <Link href="/register" className={cn(primary, "justify-center")}>
        <UserPlus className="size-3.5" />
        Register
      </Link>
    </div>
  );
}

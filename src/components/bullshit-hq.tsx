"use client";

import { useMemo, type ReactNode } from "react";
import { Image } from "@/components/image";
import { Link } from "@/components/link";
import { LedgerLoadingSplash } from "@/components/ledger-loading-splash";
import { usePayLedger } from "@/components/pay-ledger-provider";
import { TomanAmount } from "@/components/toman-icon";
import {
  ArrowRight,
  BarChart3,
  PartyPopper,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "@/components/icons";
import { BULLSHIT_TAG_LABEL } from "@/lib/constants";
import {
  computeBullshitDailySeries,
  computeBullshitInsights,
} from "@/lib/bullshit-spend";
import { cn } from "@/lib/cn";

const CHART_DAYS = 14;
/** Silly conversion for “fun facts” — arbitrary تومان per fictional luxury kebab. */
const FUN_KEBAB_TOMAN = 350_000;

function BullshitBarChart({
  series,
}: {
  series: ReturnType<typeof computeBullshitDailySeries>;
}) {
  const max = useMemo(() => {
    const m = Math.max(0, ...series.map((d) => d.total));
    return m > 0 ? m : 1;
  }, [series]);
  const points = useMemo(() => {
    if (series.length < 2) return "";
    const w = 100;
    const h = 36;
    const step = w / (series.length - 1);
    return series
      .map((d, i) => {
        const x = i * step;
        const y = h - (d.total / max) * h;
        return `${x},${y}`;
      })
      .join(" ");
  }, [series, max]);

  const desc = series
    .map(
      (d) =>
        `${d.labelWeekday} ${d.labelDate}: ${d.total} in ${d.count} tagged payments`,
    )
    .join(". ");

  return (
    <div className="space-y-3">
      <div
        className="rounded-xl border border-rose-200/60 bg-white/80 p-3 dark:border-rose-900/40 dark:bg-zinc-950/70"
        role="img"
        aria-label={`Bullshit-tagged spend per day for the last ${CHART_DAYS} days. ${desc}`}
      >
        <svg
          className="mb-2 h-10 w-full text-rose-400/90 dark:text-rose-400/70"
          viewBox="0 0 100 36"
          preserveAspectRatio="none"
          aria-hidden
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
        </svg>
        <div className="flex h-28 items-end gap-0.5 sm:gap-1">
          {series.map((d) => {
            const hPct = max > 0 ? (d.total / max) * 100 : 0;
            return (
              <div
                key={d.dayStart.getTime()}
                className="flex min-w-0 flex-1 flex-col items-center gap-1"
              >
                <div
                  className="flex w-full flex-1 flex-col justify-end"
                  title={`${d.labelWeekday} ${d.labelDate}: ${d.total} (${d.count} payments)`}
                >
                  {d.total === 0 ? (
                    <div className="h-1 w-full rounded-t-sm bg-zinc-200/90 dark:bg-zinc-700/90" />
                  ) : (
                    <div
                      className={cn(
                        "w-full min-h-[6px] rounded-t-md bg-gradient-to-t from-rose-600/90 to-rose-400/80",
                        "dark:from-rose-500 dark:to-rose-400/90",
                      )}
                      style={{ height: `${Math.max(12, hPct)}%` }}
                    />
                  )}
                </div>
                <span className="max-w-full truncate text-center text-[8px] font-medium uppercase leading-none text-zinc-500 dark:text-zinc-500 sm:text-[9px]">
                  {d.labelWeekday}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-center text-[10px] text-zinc-500 dark:text-zinc-500">
        Taller bars = more regret (tagged spend that day). Flat line = peace
        (or you forgot to tag).
      </p>
    </div>
  );
}

export function BullshitHq() {
  const { ready, state } = usePayLedger();

  const series = useMemo(
    () => computeBullshitDailySeries(state.entries, CHART_DAYS),
    [state.entries],
  );

  const insights = useMemo(
    () => computeBullshitInsights(state.entries),
    [state.entries],
  );

  const funLines = useMemo(() => {
    const lines: string[] = [];
    const kebabs =
      insights.allTimeTotal > 0
        ? Math.max(1, Math.round(insights.allTimeTotal / FUN_KEBAB_TOMAN))
        : 0;
    if (insights.allTimeTotal > 0 && kebabs > 0) {
      lines.push(
        `In purely invented units, your tagged impulse total is about ${kebabs} “premium kebab nights” — not financial advice, just vibes.`,
      );
    }
    if (insights.shareOfPaymentsPct >= 40 && insights.allTimeCount > 0) {
      lines.push(
        `Over two-fifths of your logged payments are self-labeled impulse. The first step is tagging; you’re crushing that step.`,
      );
    }
    if (insights.shareOfPaymentsPct > 0 && insights.shareOfPaymentsPct < 8) {
      lines.push(
        `Impulse is a tiny slice of your ledger. Either you’re disciplined, or you’re merciful to your future self with the tag.`,
      );
    }
    if (insights.cleanStreakDays >= 7) {
      lines.push(
        `A whole week (or more) with no ${BULLSHIT_TAG_LABEL}-tagged spend. The emoji aisle misses you.`,
      );
    }
    if (insights.impulseStreakDays >= 5) {
      lines.push(
        `${insights.impulseStreakDays} days straight with at least one honest tag. Accountability speedrun any%.`,
      );
    }
    if (insights.weekOverWeekChangePct != null && insights.last7Total > 0) {
      if (insights.weekOverWeekChangePct < -15) {
        lines.push(
          `This week’s down ${Math.abs(Math.round(insights.weekOverWeekChangePct))}% vs last week on this metric. Wallet doing calisthenics.`,
        );
      } else if (insights.weekOverWeekChangePct > 20) {
        lines.push(
          `Tagged impulse spend jumped ~${Math.round(insights.weekOverWeekChangePct)}% week over week. Stars (and ledgers) align in mysterious ways.`,
        );
      }
    }
    if (lines.length === 0) {
      lines.push(
        "Tag payments as Bullshit (or BS) when you feel it — this page turns those tags into charts and pep talks.",
      );
    }
    return lines;
  }, [insights]);

  if (!ready) {
    return <LedgerLoadingSplash />;
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl px-4 pt-10 sm:px-6 sm:pt-12",
        "pb-[calc(2rem+env(safe-area-inset-bottom,0px))]",
      )}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/"
            className={cn(
              "mb-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-500",
              "dark:text-indigo-400 dark:hover:text-indigo-300",
            )}
          >
            <ArrowRight className="size-3.5 rotate-180" aria-hidden />
            Back to ledger
          </Link>
          <div className="flex items-center gap-3">
            <Image
              src="/paymay-icon.svg"
              alt=""
              width={40}
              height={40}
              className="shrink-0 opacity-90 dark:opacity-80"
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
                PayMay
              </p>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
                Bullshit HQ
              </h1>
            </div>
          </div>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Payments tagged{" "}
            <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
              {BULLSHIT_TAG_LABEL}
            </strong>{" "}
            (boolshit / BS count too). Charts are local-time days; numbers are
            the same as your ledger.
          </p>
        </div>
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
          )}
        >
          <BarChart3 className="size-6" strokeWidth={2} aria-hidden />
        </div>
      </div>

      <section
        className={cn(
          "mb-8 rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50/90 via-white to-white p-4 shadow-sm",
          "dark:border-rose-900/45 dark:from-rose-950/40 dark:via-zinc-950 dark:to-zinc-950/90",
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-rose-600 dark:text-rose-400" />
          <h2 className="text-sm font-semibold text-rose-950 dark:text-rose-100">
            What happened (last {CHART_DAYS} days)
          </h2>
        </div>
        <BullshitBarChart series={series} />
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <PartyPopper className="size-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Fun-ish facts
          </h2>
        </div>
        <ul className="space-y-2.5">
          {funLines.map((line) => (
            <li
              key={line}
              className={cn(
                "rounded-xl border border-zinc-200/80 bg-white/90 px-3 py-2.5 text-sm leading-relaxed text-zinc-700",
                "dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300",
              )}
            >
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">
          Hard numbers
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="All-time tagged impulse"
            value={<TomanAmount value={insights.allTimeTotal} />}
            sub={`${insights.allTimeCount} payment${insights.allTimeCount === 1 ? "" : "s"}`}
          />
          <StatCard
            label="Share of all payments"
            value={`${insights.shareOfPaymentsPct.toFixed(1)}%`}
            sub={
              insights.totalPaymentVolume > 0
                ? "of total logged payment amounts"
                : "add payments to see %"
            }
          />
          <StatCard
            label="Clean streak"
            value={`${insights.cleanStreakDays} day${insights.cleanStreakDays === 1 ? "" : "s"}`}
            sub="no bullshit-tagged spend, counting backward from today"
            icon={
              insights.cleanStreakDays > insights.impulseStreakDays ? (
                <TrendingDown className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : null
            }
          />
          <StatCard
            label="Honesty streak"
            value={`${insights.impulseStreakDays} day${insights.impulseStreakDays === 1 ? "" : "s"}`}
            sub="at least one tagged impulse payment per day"
            icon={
              insights.impulseStreakDays > 2 ? (
                <TrendingUp className="size-3.5 text-rose-600 dark:text-rose-400" />
              ) : null
            }
          />
          {insights.biggest && (
            <StatCard
              className="sm:col-span-2"
              label="Largest single tagged payment"
              value={<TomanAmount value={insights.biggest.amount} />}
              sub={`“${insights.biggest.title}” · ${new Date(insights.biggest.date).toLocaleDateString()}`}
            />
          )}
          {insights.peakDay && insights.peakDay.total > 0 && (
            <StatCard
              className="sm:col-span-2"
              label="Peak regret day"
              value={<TomanAmount value={insights.peakDay.total} />}
              sub={`${insights.peakDay.dayStart.toLocaleDateString(undefined, { dateStyle: "medium" })} · ${insights.peakDay.count} tagged payment${insights.peakDay.count === 1 ? "" : "s"}`}
            />
          )}
          <StatCard
            className="sm:col-span-2"
            label="Week vs previous week"
            value={
              insights.weekOverWeekChangePct == null ? (
                <span className="text-base font-semibold text-zinc-600 dark:text-zinc-400">
                  n/a
                </span>
              ) : (
                <span
                  className={cn(
                    "text-base font-bold tabular-nums",
                    insights.weekOverWeekChangePct > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : insights.weekOverWeekChangePct < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-800 dark:text-zinc-200",
                  )}
                >
                  {insights.weekOverWeekChangePct > 0 ? "+" : ""}
                  {insights.weekOverWeekChangePct.toFixed(1)}%
                </span>
              )
            }
            sub={
              insights.prev7Total <= 0 && insights.last7Total <= 0
                ? "not enough tagged history in both windows"
                : `last 7d: ${insights.last7Total.toLocaleString()} · prev 7d: ${insights.prev7Total.toLocaleString()} (raw totals)`
            }
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  sub: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200/80 bg-white/95 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/90",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        {icon}
      </div>
      <div className="mt-1.5 text-lg font-bold tabular-nums text-zinc-900 dark:text-white [&_svg]:inline">
        {value}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-zinc-600 dark:text-zinc-500">
        {sub}
      </p>
    </div>
  );
}

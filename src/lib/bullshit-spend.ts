import type { Entry } from "@/lib/types";

/** Matches Bullshit, boolshit, BS, etc. (impulse / regret spend). */
export function isBullshitTag(raw: string): boolean {
  const s = raw
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, "");
  return s === "bullshit" || s === "boolshit" || s === "bs";
}

export function entryHasBullshitTag(entry: Entry): boolean {
  return entry.tags.some((t) => isBullshitTag(t));
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sumBullshitPaymentsInRange(
  entries: Entry[],
  fromInclusive: Date,
  toInclusive: Date,
): number {
  const a = fromInclusive.getTime();
  const b = toInclusive.getTime();
  let sum = 0;
  for (const e of entries) {
    if (e.kind !== "payment") continue;
    if (!entryHasBullshitTag(e)) continue;
    const t = new Date(e.date).getTime();
    if (t >= a && t <= b) sum += e.amount;
  }
  return sum;
}

export type BullshitSpendWindow = {
  total: number;
  from: Date;
  to: Date;
};

export type BullshitSpendReport = {
  today: BullshitSpendWindow;
  last7Days: BullshitSpendWindow;
  paymentCountToday: number;
  paymentCountWeek: number;
};

export function computeBullshitSpendReport(entries: Entry[]): BullshitSpendReport {
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const weekStart = startOfLocalDay(new Date(now));
  weekStart.setDate(weekStart.getDate() - 6);

  const today = sumBullshitPaymentsInRange(entries, todayStart, todayEnd);
  const last7Days = sumBullshitPaymentsInRange(entries, weekStart, todayEnd);

  let paymentCountToday = 0;
  let paymentCountWeek = 0;
  const a = todayStart.getTime();
  const b = todayEnd.getTime();
  const w = weekStart.getTime();
  for (const e of entries) {
    if (e.kind !== "payment" || !entryHasBullshitTag(e)) continue;
    const t = new Date(e.date).getTime();
    if (t >= a && t <= b) paymentCountToday += 1;
    if (t >= w && t <= b) paymentCountWeek += 1;
  }

  return {
    today: { total: today, from: todayStart, to: todayEnd },
    last7Days: { total: last7Days, from: weekStart, to: todayEnd },
    paymentCountToday,
    paymentCountWeek,
  };
}

/** One calendar day bucket for charting bullshit payment totals. */
export type BullshitDayBar = {
  dayStart: Date;
  labelWeekday: string;
  labelDate: string;
  total: number;
  count: number;
};

/** Last `dayCount` calendar days (ending today), local time, for bar charts. */
export function computeBullshitDailySeries(
  entries: Entry[],
  dayCount: number,
): BullshitDayBar[] {
  const now = new Date();
  const series: BullshitDayBar[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const from = startOfLocalDay(d);
    const to = endOfLocalDay(d);
    let total = 0;
    let count = 0;
    for (const e of entries) {
      if (e.kind !== "payment" || !entryHasBullshitTag(e)) continue;
      const t = new Date(e.date).getTime();
      if (t >= from.getTime() && t <= to.getTime()) {
        total += e.amount;
        count += 1;
      }
    }
    series.push({
      dayStart: from,
      labelWeekday: from.toLocaleDateString(undefined, { weekday: "short" }),
      labelDate: from.toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
      }),
      total,
      count,
    });
  }
  return series;
}

export type BullshitInsights = {
  allTimeTotal: number;
  allTimeCount: number;
  biggest: { title: string; amount: number; date: string } | null;
  /** Calendar day with the highest combined bullshit spend. */
  peakDay: { dayStart: Date; total: number; count: number } | null;
  totalPaymentVolume: number;
  /** Share of raw payment amounts (not tag-weighted). */
  shareOfPaymentsPct: number;
  /** Consecutive local days ending today with zero bullshit-tagged spend. */
  cleanStreakDays: number;
  /** Consecutive local days ending today with at least one bullshit-tagged payment. */
  impulseStreakDays: number;
  last7Total: number;
  prev7Total: number;
  weekOverWeekChangePct: number | null;
};

export function computeBullshitInsights(entries: Entry[]): BullshitInsights {
  const bullshitPayments = entries.filter(
    (e) => e.kind === "payment" && entryHasBullshitTag(e),
  );

  let totalPaymentVolume = 0;
  for (const e of entries) {
    if (e.kind === "payment") totalPaymentVolume += e.amount;
  }

  let allTimeTotal = 0;
  let allTimeCount = 0;
  let biggest: BullshitInsights["biggest"] = null;
  const byDay = new Map<
    string,
    { dayStart: Date; total: number; count: number }
  >();

  for (const e of bullshitPayments) {
    allTimeTotal += e.amount;
    allTimeCount += 1;
    if (!biggest || e.amount > biggest.amount) {
      biggest = {
        title: e.title.trim() || "Untitled",
        amount: e.amount,
        date: e.date,
      };
    }
    const ds = startOfLocalDay(new Date(e.date));
    const key = `${ds.getFullYear()}-${ds.getMonth()}-${ds.getDate()}`;
    const cur = byDay.get(key);
    if (cur) {
      cur.total += e.amount;
      cur.count += 1;
    } else {
      byDay.set(key, { dayStart: ds, total: e.amount, count: 1 });
    }
  }

  let peakDay: BullshitInsights["peakDay"] = null;
  for (const v of byDay.values()) {
    if (!peakDay || v.total > peakDay.total) {
      peakDay = {
        dayStart: v.dayStart,
        total: v.total,
        count: v.count,
      };
    }
  }

  const shareOfPaymentsPct =
    totalPaymentVolume > 0 ? (allTimeTotal / totalPaymentVolume) * 100 : 0;

  const now = new Date();
  let cleanStreakDays = 0;
  for (let i = 0; i < 4000; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const from = startOfLocalDay(d);
    const to = endOfLocalDay(d);
    const dayTotal = sumBullshitPaymentsInRange(entries, from, to);
    if (dayTotal === 0) cleanStreakDays += 1;
    else break;
  }

  let impulseStreakDays = 0;
  for (let i = 0; i < 4000; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const from = startOfLocalDay(d);
    const to = endOfLocalDay(d);
    const dayTotal = sumBullshitPaymentsInRange(entries, from, to);
    if (dayTotal > 0) impulseStreakDays += 1;
    else break;
  }

  const todayEnd = endOfLocalDay(now);
  const last7Start = startOfLocalDay(new Date(now));
  last7Start.setDate(last7Start.getDate() - 6);
  const last7Total = sumBullshitPaymentsInRange(
    entries,
    last7Start,
    todayEnd,
  );

  const prevWeekEnd = new Date(last7Start);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  const prev7End = endOfLocalDay(prevWeekEnd);
  const prev7Start = startOfLocalDay(new Date(prevWeekEnd));
  prev7Start.setDate(prev7Start.getDate() - 6);
  const prev7Total = sumBullshitPaymentsInRange(
    entries,
    prev7Start,
    prev7End,
  );

  let weekOverWeekChangePct: number | null = null;
  if (prev7Total > 0) {
    weekOverWeekChangePct = ((last7Total - prev7Total) / prev7Total) * 100;
  } else if (last7Total > 0 && prev7Total === 0) {
    weekOverWeekChangePct = null;
  } else {
    weekOverWeekChangePct = 0;
  }

  return {
    allTimeTotal,
    allTimeCount,
    biggest,
    peakDay,
    totalPaymentVolume,
    shareOfPaymentsPct,
    cleanStreakDays,
    impulseStreakDays,
    last7Total,
    prev7Total,
    weekOverWeekChangePct,
  };
}

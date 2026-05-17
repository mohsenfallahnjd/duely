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

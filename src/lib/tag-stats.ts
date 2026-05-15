import type { Entry } from "@/lib/types";

/**
 * Allocates each payment's amount evenly across its tags so totals add up to
 * 100% of payment spend (no double-counting).
 */
export function computeTagPaymentShares(entries: Entry[]) {
  let totalPayments = 0;
  const byTag = new Map<string, number>();

  for (const e of entries) {
    if (e.kind !== "payment") continue;
    totalPayments += e.amount;
    const tags = [...new Set(e.tags.map((t) => t.trim()).filter(Boolean))];
    if (tags.length === 0) continue;
    const share = e.amount / tags.length;
    for (const t of tags) {
      byTag.set(t, (byTag.get(t) ?? 0) + share);
    }
  }

  return { totalPayments, byTag };
}

export function tagSpendPercent(
  totalPayments: number,
  tagTotal: number,
): number {
  if (totalPayments <= 0 || tagTotal <= 0) return 0;
  return Math.min(100, (tagTotal / totalPayments) * 100);
}

/** All distinct tags used on any entry (sorted). */
export function collectAllTags(entries: Entry[]): string[] {
  const u = new Set<string>();
  for (const e of entries) {
    for (const t of e.tags) {
      const x = t.trim();
      if (x) u.add(x);
    }
  }
  return [...u].sort((a, b) => a.localeCompare(b));
}

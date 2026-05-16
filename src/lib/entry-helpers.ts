import type { Entry } from "@/lib/types";

/** Debt or expected-in entry where progress has reached the full amount (hidden from list when “settled” filter is on). */
export function isEntryFullySettled(entry: Entry): boolean {
  if (entry.kind === "payment") return false;
  if (entry.amount <= 0) return false;
  return entry.progressAmount >= entry.amount;
}

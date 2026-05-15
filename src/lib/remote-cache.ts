import type { PayState } from "@/lib/types";
import type { OutboxOp } from "@/lib/outbox-types";

export type PersistedCloudLedger = {
  state: PayState;
  serverContactIds: string[];
  serverEntryIds: string[];
};

function mirrorKey(userId: string) {
  return `pay-may:mirror-v1:${userId}`;
}

function outboxKey(userId: string) {
  return `pay-may:outbox-v1:${userId}`;
}

export function loadCloudMirror(userId: string): PersistedCloudLedger | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(mirrorKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedCloudLedger;
    if (!parsed?.state?.contacts || !parsed?.state?.entries) return null;
    if (!Array.isArray(parsed.serverContactIds))
      parsed.serverContactIds = [];
    if (!Array.isArray(parsed.serverEntryIds)) parsed.serverEntryIds = [];
    return parsed;
  } catch {
    return null;
  }
}

export function saveCloudMirror(userId: string, data: PersistedCloudLedger) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(mirrorKey(userId), JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function loadOutbox(userId: string): OutboxOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(outboxKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is OutboxOp =>
        Boolean(x) && typeof x === "object" && (x as OutboxOp).v === 1,
    );
  } catch {
    return [];
  }
}

export function saveOutbox(userId: string, ops: OutboxOp[]) {
  if (typeof window === "undefined") return;
  try {
    if (ops.length === 0) localStorage.removeItem(outboxKey(userId));
    else localStorage.setItem(outboxKey(userId), JSON.stringify(ops));
  } catch {
    /* ignore */
  }
}

export function clearOutbox(userId: string) {
  saveOutbox(userId, []);
}

export function appendOutbox(userId: string, op: OutboxOp) {
  const next = [...loadOutbox(userId), op];
  saveOutbox(userId, next);
}

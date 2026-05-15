import type { Session } from "next-auth";

const KEY = "pay-may:ledger-auth-backup-v1";

type Backup = {
  id: string;
  email?: string | null;
};

export function saveLedgerAuthBackup(user: NonNullable<Session["user"]>) {
  if (typeof window === "undefined" || !user.id) return;
  try {
    const payload: Backup = { id: user.id, email: user.email };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function loadLedgerAuthBackup(): Backup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Backup;
    if (!parsed?.id || typeof parsed.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLedgerAuthBackup() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

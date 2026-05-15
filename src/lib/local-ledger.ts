import { STORAGE_KEY } from "@/lib/constants";
import type { PayState } from "@/lib/types";

const empty: PayState = { contacts: [], entries: [] };

export function loadLocal(): PayState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as PayState;
    if (!parsed.entries || !parsed.contacts) return empty;
    return { contacts: parsed.contacts, entries: parsed.entries };
  } catch {
    return empty;
  }
}

export function saveLocal(state: PayState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

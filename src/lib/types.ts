export type EntryKind = "payment" | "debt" | "pending";

export interface Contact {
  id: string;
  name: string;
  accent: string;
  /** From device contact book or manual; optional for sync. */
  phone?: string | null;
}

export interface Entry {
  id: string;
  kind: EntryKind;
  title: string;
  /** Total amount: spent (payment), owed (debt), or expected (pending) */
  amount: number;
  /** For debt: paid so far. For pending: received/settled so far. Ignored for payment. */
  progressAmount: number;
  contactId: string | null;
  tags: string[];
  date: string;
  note: string;
  createdAt: string;
}

export interface PayState {
  contacts: Contact[];
  entries: Entry[];
}

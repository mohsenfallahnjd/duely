import type { OutboxOp } from "@/lib/outbox-types";
import type { Contact, Entry, EntryKind, PayState } from "@/lib/types";

async function readLedgerResponse(res: Response): Promise<PayState> {
  const json: unknown = await res.json();
  if (!res.ok) {
    const err =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : res.statusText;
    throw new Error(err);
  }
  return json as PayState;
}

export async function apiFetchLedger(): Promise<PayState> {
  const res = await fetch("/api/ledger", { credentials: "include" });
  return readLedgerResponse(res);
}

export async function apiSyncOutbox(ops: OutboxOp[]): Promise<PayState> {
  const res = await fetch("/api/ledger/sync", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ops }),
  });
  return readLedgerResponse(res);
}

export async function apiAddContact(
  name: string,
  accent: string,
  phone: string | null,
): Promise<Contact> {
  const res = await fetch("/api/ledger/contacts", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, accent, phone }),
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    const err =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : res.statusText;
    throw new Error(err);
  }
  return json as Contact;
}

export async function apiRemoveContact(id: string): Promise<void> {
  const res = await fetch(
    `/api/ledger/contacts?id=${encodeURIComponent(id)}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) {
    const json: unknown = await res.json().catch(() => ({}));
    const err =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : res.statusText;
    throw new Error(err);
  }
}

export async function apiAddEntry(input: {
  kind: EntryKind;
  title: string;
  amount: number;
  progressAmount: number;
  contactId: string | null;
  tags: string[];
  dateIso: string;
  note: string;
}): Promise<Entry> {
  const res = await fetch("/api/ledger/entries", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: input.kind,
      title: input.title,
      amount: input.amount,
      progressAmount: input.progressAmount,
      contactId: input.contactId,
      tags: input.tags,
      dateIso: input.dateIso,
      note: input.note,
    }),
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    const err =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : res.statusText;
    throw new Error(err);
  }
  return json as Entry;
}

export async function apiUpdateEntryProgress(
  id: string,
  progressAmount: number,
): Promise<void> {
  const res = await fetch(`/api/ledger/entries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progressAmount }),
  });
  if (!res.ok) {
    const json: unknown = await res.json().catch(() => ({}));
    const err =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : res.statusText;
    throw new Error(err);
  }
}

export async function apiUpdateEntry(input: {
  id: string;
  kind: EntryKind;
  title: string;
  amount: number;
  progressAmount: number;
  contactId: string | null;
  tags: string[];
  dateIso: string;
  note: string;
}): Promise<void> {
  const res = await fetch(
    `/api/ledger/entries/${encodeURIComponent(input.id)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: input.kind,
        title: input.title,
        amount: input.amount,
        progressAmount: input.progressAmount,
        contactId: input.contactId,
        tags: input.tags,
        dateIso: input.dateIso,
        note: input.note,
      }),
    },
  );
  if (!res.ok) {
    const json: unknown = await res.json().catch(() => ({}));
    const err =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : res.statusText;
    throw new Error(err);
  }
}

export async function apiRemoveEntry(id: string): Promise<void> {
  const res = await fetch(`/api/ledger/entries/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const json: unknown = await res.json().catch(() => ({}));
    const err =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : res.statusText;
    throw new Error(err);
  }
}

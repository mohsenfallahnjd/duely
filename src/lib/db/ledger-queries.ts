import { eq, desc, asc, and } from "drizzle-orm";
import { requireDb } from "@/db";
import { contacts, entries } from "@/db/schema";
import type { Contact, Entry, EntryKind, PayState } from "@/lib/types";
import type { OutboxOp } from "@/lib/outbox-types";
import { auth } from "@/auth";

function mapContactRow(row: typeof contacts.$inferSelect): Contact {
  return {
    id: row.id,
    name: row.name,
    accent: row.accent,
    phone: row.phone ?? undefined,
  };
}

function mapEntryRow(row: typeof entries.$inferSelect): Entry {
  const d = row.entryDate as string;
  const raw =
    typeof d === "string" && d.length === 10
      ? `${d}T12:00:00.000Z`
      : new Date(d).toISOString();
  return {
    id: row.id,
    kind: row.kind as EntryKind,
    title: row.title,
    amount: row.amount,
    progressAmount: row.progressAmount,
    contactId: row.contactId,
    tags: row.tags ?? [],
    date: raw,
    note: row.note ?? "",
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function fetchLedgerForUser(userId: string): Promise<PayState> {
  const db = requireDb();
  const [cRows, eRows] = await Promise.all([
    db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(asc(contacts.createdAt)),
    db
      .select()
      .from(entries)
      .where(eq(entries.userId, userId))
      .orderBy(desc(entries.createdAt)),
  ]);
  return {
    contacts: cRows.map(mapContactRow),
    entries: eRows.map(mapEntryRow),
  };
}

export async function insertContact(
  userId: string,
  name: string,
  accent: string,
  phone?: string | null,
): Promise<Contact> {
  const db = requireDb();
  const [row] = await db
    .insert(contacts)
    .values({
      userId,
      name,
      accent,
      phone: phone?.trim() || null,
    })
    .returning();
  if (!row) throw new Error("Insert contact failed");
  return mapContactRow(row);
}

export async function deleteContact(userId: string, contactId: string) {
  const db = requireDb();
  await db
    .delete(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));
}

export async function insertEntry(
  userId: string,
  input: {
    kind: EntryKind;
    title: string;
    amount: number;
    progressAmount: number;
    contactId: string | null;
    tags: string[];
    dateIso: string;
    note: string;
  },
): Promise<Entry> {
  const db = requireDb();
  const entryDate = input.dateIso.slice(0, 10);
  const [row] = await db
    .insert(entries)
    .values({
      userId,
      kind: input.kind,
      title: input.title,
      amount: input.amount,
      progressAmount: input.progressAmount,
      contactId: input.contactId,
      tags: input.tags,
      entryDate,
      note: input.note,
    })
    .returning();
  if (!row) throw new Error("Insert entry failed");
  return mapEntryRow(row);
}

export async function updateEntryProgress(
  userId: string,
  entryId: string,
  progressAmount: number,
) {
  const db = requireDb();
  await db
    .update(entries)
    .set({ progressAmount })
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)));
}

export async function deleteEntry(userId: string, entryId: string) {
  const db = requireDb();
  await db
    .delete(entries)
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)));
}

export async function applyOutboxOps(
  userId: string,
  ops: OutboxOp[],
): Promise<void> {
  const idMap = new Map<string, string>();

  for (const op of ops) {
    switch (op.kind) {
      case "contact.add": {
        const c = await insertContact(
          userId,
          op.name,
          op.accent,
          op.phone,
        );
        idMap.set(op.localId, c.id);
        break;
      }
      case "contact.remove": {
        const id = idMap.get(op.contactId) ?? op.contactId;
        await deleteContact(userId, id);
        break;
      }
      case "entry.add": {
        const contactId = op.contactLocalId
          ? (idMap.get(op.contactLocalId) ?? op.contactLocalId)
          : null;
        const entry = await insertEntry(userId, {
          kind: op.entryKind,
          title: op.title,
          amount: op.amount,
          progressAmount: op.progressAmount,
          contactId,
          tags: op.tags,
          dateIso: op.dateIso,
          note: op.note,
        });
        idMap.set(op.localId, entry.id);
        break;
      }
      case "entry.progress": {
        const id = idMap.get(op.entryId) ?? op.entryId;
        await updateEntryProgress(userId, id, op.progressAmount);
        break;
      }
      case "entry.remove": {
        const id = idMap.get(op.entryId) ?? op.entryId;
        await deleteEntry(userId, id);
        break;
      }
    }
  }
}

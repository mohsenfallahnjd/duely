import type { SupabaseClient } from "@supabase/supabase-js";
import type { OutboxOp } from "@/lib/outbox-types";
import * as repo from "@/lib/supabase/ledger-repo";

export type { OutboxOp } from "@/lib/outbox-types";

export async function flushOutbox(
  supabase: SupabaseClient,
  ops: OutboxOp[],
): Promise<void> {
  const idMap = new Map<string, string>();

  for (const op of ops) {
    switch (op.kind) {
      case "contact.add": {
        const row = await repo.remoteAddContact(
          supabase,
          op.name,
          op.accent,
          op.phone,
        );
        idMap.set(op.localId, row.id);
        break;
      }
      case "contact.remove": {
        const id = idMap.get(op.contactId) ?? op.contactId;
        await repo.remoteRemoveContact(supabase, id);
        break;
      }
      case "entry.add": {
        const contactId = op.contactLocalId
          ? (idMap.get(op.contactLocalId) ?? op.contactLocalId)
          : null;
        const entry = await repo.remoteAddEntry(supabase, {
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
        await repo.remoteUpdateEntryProgress(supabase, id, op.progressAmount);
        break;
      }
      case "entry.remove": {
        const id = idMap.get(op.entryId) ?? op.entryId;
        await repo.remoteRemoveEntry(supabase, id);
        break;
      }
    }
  }
}

export function pruneOutboxForDeletedLocalContact(
  outbox: OutboxOp[],
  contactLocalId: string,
): OutboxOp[] {
  const entryLocalIdsToDrop = new Set<string>();
  const filtered = outbox.filter((op) => {
    if (op.kind === "contact.add" && op.localId === contactLocalId) {
      return false;
    }
    if (op.kind === "entry.add" && op.contactLocalId === contactLocalId) {
      entryLocalIdsToDrop.add(op.localId);
      return false;
    }
    return true;
  });
  return filtered.filter((op) => {
    if (op.kind === "entry.progress" && entryLocalIdsToDrop.has(op.entryId)) {
      return false;
    }
    if (op.kind === "entry.remove" && entryLocalIdsToDrop.has(op.entryId)) {
      return false;
    }
    return true;
  });
}

export function pruneOutboxForDeletedLocalEntry(
  outbox: OutboxOp[],
  localEntryId: string,
): OutboxOp[] {
  return outbox.filter((op) => {
    if (op.kind === "entry.add" && op.localId === localEntryId) return false;
    if (op.kind === "entry.progress" && op.entryId === localEntryId)
      return false;
    if (op.kind === "entry.remove" && op.entryId === localEntryId) return false;
    return true;
  });
}

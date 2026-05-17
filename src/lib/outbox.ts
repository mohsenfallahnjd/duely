import type { EntryKind, PayState } from "@/lib/types";
import type { OutboxOp } from "@/lib/outbox-types";
import { apiSyncOutbox } from "@/lib/ledger-api-client";
import { loadOutbox, saveOutbox } from "@/lib/remote-cache";

export type { OutboxOp } from "@/lib/outbox-types";

export async function flushOutboxClient(ops: OutboxOp[]): Promise<PayState> {
  return apiSyncOutbox(ops);
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
    if (op.kind === "entry.update" && entryLocalIdsToDrop.has(op.entryId)) {
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
    if (op.kind === "entry.update" && op.entryId === localEntryId)
      return false;
    if (op.kind === "entry.remove" && op.entryId === localEntryId)
      return false;
    return true;
  });
}

/** Patch a pending `entry.add` in the outbox (same device, before server id). */
export function patchPendingEntryAddInOutbox(
  userId: string,
  localId: string,
  patch: {
    entryKind: EntryKind;
    title: string;
    amount: number;
    progressAmount: number;
    contactLocalId: string | null;
    tags: string[];
    dateIso: string;
    note: string;
  },
): boolean {
  const o = loadOutbox(userId);
  let hit = false;
  const next = o
    .filter(
      (op) => !(op.kind === "entry.progress" && op.entryId === localId),
    )
    .map((op) => {
      if (op.kind === "entry.add" && op.localId === localId) {
        hit = true;
        return {
          ...op,
          entryKind: patch.entryKind,
          title: patch.title,
          amount: patch.amount,
          progressAmount: patch.progressAmount,
          contactLocalId: patch.contactLocalId,
          tags: patch.tags,
          dateIso: patch.dateIso,
          note: patch.note,
        };
      }
      return op;
    });
  if (!hit) return false;
  saveOutbox(userId, next);
  return true;
}

/** Queue a full entry sync; drops prior progress/update ops for that entry id. */
export function queueEntryFullUpdateOutbox(
  userId: string,
  op: Extract<OutboxOp, { kind: "entry.update" }>,
) {
  const o = loadOutbox(userId);
  const next = [
    ...o.filter(
      (x) =>
        !(
          (x.kind === "entry.progress" || x.kind === "entry.update") &&
          x.entryId === op.entryId
        ),
    ),
    op,
  ];
  saveOutbox(userId, next);
}

import type { PayState } from "@/lib/types";
import type { OutboxOp } from "@/lib/outbox-types";
import { apiSyncOutbox } from "@/lib/ledger-api-client";

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

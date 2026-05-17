import type { EntryKind } from "@/lib/types";

/** Serializable pending mutation for cloud sync (see `flushOutboxClient` in outbox.ts). */
export type OutboxOp =
  | {
      v: 1;
      kind: "contact.add";
      localId: string;
      name: string;
      accent: string;
      phone: string | null;
    }
  | { v: 1; kind: "contact.remove"; contactId: string }
  | {
      v: 1;
      kind: "entry.add";
      localId: string;
      entryKind: EntryKind;
      title: string;
      amount: number;
      progressAmount: number;
      contactLocalId: string | null;
      tags: string[];
      dateIso: string;
      note: string;
      createdAt: string;
    }
  | { v: 1; kind: "entry.progress"; entryId: string; progressAmount: number }
  | {
      v: 1;
      kind: "entry.update";
      entryId: string;
      entryKind: EntryKind;
      title: string;
      amount: number;
      progressAmount: number;
      contactLocalId: string | null;
      tags: string[];
      dateIso: string;
      note: string;
    }
  | { v: 1; kind: "entry.remove"; entryId: string };

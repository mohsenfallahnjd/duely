"use client";

import { signOut as nextAuthSignOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ACCENT_PRESETS } from "@/lib/constants";
import { loadLocal, saveLocal } from "@/lib/local-ledger";
import {
  apiAddContact,
  apiAddEntry,
  apiFetchLedger,
  apiRemoveContact,
  apiRemoveEntry,
  apiUpdateEntryProgress,
} from "@/lib/ledger-api-client";
import {
  appendOutbox,
  clearOutbox,
  loadCloudMirror,
  loadOutbox,
  saveCloudMirror,
  saveOutbox,
} from "@/lib/remote-cache";
import type { OutboxOp } from "@/lib/outbox-types";
import {
  flushOutboxClient,
  pruneOutboxForDeletedLocalContact,
  pruneOutboxForDeletedLocalEntry,
} from "@/lib/outbox";
import type { Contact, Entry, EntryKind, PayState } from "@/lib/types";
import {
  clearLedgerAuthBackup,
  loadLedgerAuthBackup,
  saveLedgerAuthBackup,
} from "@/lib/auth-offline-backup";

const empty: PayState = { contacts: [], entries: [] };

function setsFromRemote(state: PayState) {
  return {
    contacts: new Set(state.contacts.map((c) => c.id)),
    entries: new Set(state.entries.map((e) => e.id)),
  };
}

const syncEnabled =
  typeof process.env.NEXT_PUBLIC_CLOUD_SYNC === "undefined" ||
  (process.env.NEXT_PUBLIC_CLOUD_SYNC !== "0" &&
    process.env.NEXT_PUBLIC_CLOUD_SYNC !== "false");

type LedgerUser = NonNullable<Session["user"]>;

type LedgerContextValue = {
  ready: boolean;
  syncEnabled: boolean;
  user: LedgerUser | null;
  /** Browser online — logged-out users may ignore. */
  networkOnline: boolean;
  /** Logged in: number of mutations waiting for sync. */
  pendingOutboxCount: number;
  /** Initial load or flushing outbox / refetching. */
  syncBusy: boolean;
  /** Last cloud sync error message, if any. */
  syncError: string | null;
  resync: () => Promise<void>;
  state: PayState;
  contactsById: Map<string, Contact>;
  addContact: (
    name: string,
    opts?: { phone?: string | null },
  ) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  addEntry: (input: {
    kind: EntryKind;
    title: string;
    amount: number;
    progressAmount: number;
    contactId: string | null;
    tags: string[];
    date: string;
    note: string;
  }) => Promise<void>;
  updateEntryProgress: (id: string, progressAmount: number) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  totals: {
    payments: number;
    debtOutstanding: number;
    pendingOutstanding: number;
  };
  signOut: () => Promise<void>;
};

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function PayLedgerProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const sessionUser = session?.user ?? null;

  const [dataReady, setDataReady] = useState(false);
  const [state, setState] = useState<PayState>(empty);

  const [networkOnline, setNetworkOnline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine,
  );

  useEffect(() => {
    if (sessionUser?.id) {
      saveLedgerAuthBackup(sessionUser);
    } else if (
      typeof navigator !== "undefined" &&
      navigator.onLine &&
      status === "unauthenticated"
    ) {
      clearLedgerAuthBackup();
    }
  }, [sessionUser, status]);

  const authBackup = loadLedgerAuthBackup();
  const allowOfflineAuth = !networkOnline && authBackup !== null;
  const user: LedgerUser | null =
    sessionUser ??
    (allowOfflineAuth
      ? {
          id: authBackup.id,
          email: authBackup.email ?? "",
        }
      : null);

  const authReady = status !== "loading" || allowOfflineAuth;

  const userId = user?.id;

  const [pendingOutboxCount, setPendingOutboxCount] = useState(0);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const serverIdsRef = useRef<{ contacts: Set<string>; entries: Set<string> }>(
    { contacts: new Set(), entries: new Set() },
  );
  const flushAndResyncRef = useRef<(() => Promise<void>) | null>(null);

  const cloudActive = syncEnabled && Boolean(userId);

  useEffect(() => {
    const online = () => {
      setNetworkOnline(true);
      void flushAndResyncRef.current?.();
    };
    const offline = () => setNetworkOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  const flushAndResync = useCallback(async () => {
    if (!cloudActive || !userId || !navigator.onLine) return;
    const ops = loadOutbox(userId);
    if (ops.length === 0) return;
    setSyncBusy(true);
    setSyncError(null);
    try {
      const remote = await flushOutboxClient(ops);
      clearOutbox(userId);
      setPendingOutboxCount(0);
      setState(remote);
      const sets = setsFromRemote(remote);
      serverIdsRef.current = sets;
      saveCloudMirror(userId, {
        state: remote,
        serverContactIds: [...sets.contacts],
        serverEntryIds: [...sets.entries],
      });
    } catch (err) {
      console.error(err);
      setSyncError(
        err instanceof Error ? err.message : "Sync failed.",
      );
      setPendingOutboxCount(loadOutbox(userId).length);
    } finally {
      setSyncBusy(false);
    }
  }, [cloudActive, userId]);

  useEffect(() => {
    flushAndResyncRef.current = flushAndResync;
  }, [flushAndResync]);

  /** If we have queued mutations and the browser is online, try to flush (with small delay for batching). */
  useEffect(() => {
    if (!authReady || !dataReady) return;
    if (!cloudActive || !networkOnline) return;
    if (syncBusy || syncError) return;
    if (pendingOutboxCount === 0) return;
    const t = window.setTimeout(() => {
      void flushAndResyncRef.current?.();
    }, 400);
    return () => window.clearTimeout(t);
  }, [
    authReady,
    dataReady,
    cloudActive,
    networkOnline,
    pendingOutboxCount,
    syncBusy,
    syncError,
  ]);

  useEffect(() => {
    if (!authReady) return;

    if (!cloudActive || !userId) {
      serverIdsRef.current = { contacts: new Set(), entries: new Set() };
      const id = window.setTimeout(() => {
        setDataReady(false);
        setSyncError(null);
        setPendingOutboxCount(0);
        queueMicrotask(() => {
          setState(loadLocal());
          setDataReady(true);
        });
      }, 0);
      return () => window.clearTimeout(id);
    }

    let cancelled = false;

    void (async () => {
      setDataReady(false);
      setSyncBusy(true);
      setSyncError(null);
      const persisted = loadCloudMirror(userId);
      const outbox = loadOutbox(userId);
      setPendingOutboxCount(outbox.length);

      if (persisted) {
        serverIdsRef.current = {
          contacts: new Set(persisted.serverContactIds),
          entries: new Set(persisted.serverEntryIds),
        };
      } else {
        serverIdsRef.current = { contacts: new Set(), entries: new Set() };
      }

      const online = navigator.onLine;

      if (online) {
        try {
          if (outbox.length === 0) {
            const remote = await apiFetchLedger();
            if (cancelled) return;
            setState(remote);
            const sets = setsFromRemote(remote);
            serverIdsRef.current = sets;
            saveCloudMirror(userId, {
              state: remote,
              serverContactIds: [...sets.contacts],
              serverEntryIds: [...sets.entries],
            });
          } else if (persisted) {
            setState(persisted.state);
            const remote = await flushOutboxClient(outbox);
            if (cancelled) return;
            clearOutbox(userId);
            setPendingOutboxCount(0);
            setState(remote);
            const sets = setsFromRemote(remote);
            serverIdsRef.current = sets;
            saveCloudMirror(userId, {
              state: remote,
              serverContactIds: [...sets.contacts],
              serverEntryIds: [...sets.entries],
            });
          } else {
            const remote = await flushOutboxClient(outbox);
            if (cancelled) return;
            clearOutbox(userId);
            setPendingOutboxCount(0);
            setState(remote);
            const sets = setsFromRemote(remote);
            serverIdsRef.current = sets;
            saveCloudMirror(userId, {
              state: remote,
              serverContactIds: [...sets.contacts],
              serverEntryIds: [...sets.entries],
            });
          }
        } catch (err) {
          console.error(err);
          if (!cancelled) {
            if (persisted?.state) {
              setState(persisted.state);
              setSyncError(
                "Server unreachable — showing saved copy on this device.",
              );
            } else {
              setState(empty);
              setSyncError(
                err instanceof Error ? err.message : "Failed to load.",
              );
            }
            setPendingOutboxCount(loadOutbox(userId).length);
          }
        }
      } else if (persisted?.state) {
        setState(persisted.state);
        setSyncError(null);
      } else {
        setState(empty);
        setSyncError("Offline — connect to the internet for first-time setup.");
      }

      if (!cancelled) {
        setDataReady(true);
        setSyncBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, cloudActive, userId]);

  useEffect(() => {
    if (!authReady || !dataReady) return;
    if (!cloudActive || !userId) {
      saveLocal(state);
      return;
    }
    saveCloudMirror(userId, {
      state,
      serverContactIds: [...serverIdsRef.current.contacts],
      serverEntryIds: [...serverIdsRef.current.entries],
    });
  }, [authReady, dataReady, state, cloudActive, userId]);

  const resync = useCallback(async () => {
    if (!cloudActive || !userId) return;
    if (!navigator.onLine) {
      setSyncError("You are offline.");
      return;
    }
    const ops = loadOutbox(userId);
    setSyncBusy(true);
    setSyncError(null);
    try {
      let remote: PayState;
      if (ops.length > 0) {
        remote = await flushOutboxClient(ops);
        clearOutbox(userId);
        setPendingOutboxCount(0);
      } else {
        remote = await apiFetchLedger();
      }
      setState(remote);
      const sets = setsFromRemote(remote);
      serverIdsRef.current = sets;
      saveCloudMirror(userId, {
        state: remote,
        serverContactIds: [...sets.contacts],
        serverEntryIds: [...sets.entries],
      });
    } catch (err) {
      console.error(err);
      setSyncError(
        err instanceof Error ? err.message : "Sync failed.",
      );
      setPendingOutboxCount(loadOutbox(userId).length);
    } finally {
      setSyncBusy(false);
    }
  }, [cloudActive, userId]);

  const contactsById = useMemo(() => {
    const m = new Map<string, Contact>();
    state.contacts.forEach((c) => m.set(c.id, c));
    return m;
  }, [state.contacts]);

  const totals = useMemo(() => {
    let payments = 0;
    let debtOutstanding = 0;
    let pendingOutstanding = 0;
    for (const e of state.entries) {
      if (e.kind === "payment") payments += e.amount;
      else if (e.kind === "debt")
        debtOutstanding += Math.max(0, e.amount - e.progressAmount);
      else pendingOutstanding += Math.max(0, e.amount - e.progressAmount);
    }
    return { payments, debtOutstanding, pendingOutstanding };
  }, [state.entries]);

  const tryRemoteOrQueue = useCallback(
    async (op: OutboxOp, remote: () => Promise<void>) => {
      if (!userId) return;
      if (navigator.onLine) {
        try {
          await remote();
          return;
        } catch (e) {
          console.error(e);
        }
      }
      appendOutbox(userId, op);
      setPendingOutboxCount(loadOutbox(userId).length);
    },
    [userId],
  );

  const addContact = useCallback(
    async (name: string, opts?: { phone?: string | null }) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const accent =
        ACCENT_PRESETS[state.contacts.length % ACCENT_PRESETS.length]!;
      const phone = opts?.phone?.trim() || null;

      if (cloudActive && userId) {
        if (navigator.onLine) {
          try {
            const row = await apiAddContact(trimmed, accent, phone);
            serverIdsRef.current.contacts.add(row.id);
            setState((s) => ({ ...s, contacts: [...s.contacts, row] }));
            return;
          } catch (e) {
            console.error(e);
          }
        }
        const localId = crypto.randomUUID();
        appendOutbox(userId, {
          v: 1,
          kind: "contact.add",
          localId,
          name: trimmed,
          accent,
          phone,
        });
        setPendingOutboxCount(loadOutbox(userId).length);
        setState((s) => ({
          ...s,
          contacts: [
            ...s.contacts,
            { id: localId, name: trimmed, accent, ...(phone ? { phone } : {}) },
          ],
        }));
        return;
      }

      setState((s) => ({
        ...s,
        contacts: [
          ...s.contacts,
          {
            id: crypto.randomUUID(),
            name: trimmed,
            accent,
            ...(phone ? { phone } : {}),
          },
        ],
      }));
    },
    [cloudActive, state.contacts.length, userId],
  );

  const removeContact = useCallback(
    async (id: string) => {
      const isServerContact = serverIdsRef.current.contacts.has(id);

      setState((s) => ({
        contacts: s.contacts.filter((c) => c.id !== id),
        entries: s.entries.map((e) =>
          e.contactId === id ? { ...e, contactId: null } : e,
        ),
      }));

      if (!cloudActive || !userId) return;

      if (isServerContact) {
        serverIdsRef.current.contacts.delete(id);
        await tryRemoteOrQueue(
          { v: 1, kind: "contact.remove", contactId: id },
          async () => {
            await apiRemoveContact(id);
          },
        );
      } else {
        const pruned = pruneOutboxForDeletedLocalContact(loadOutbox(userId), id);
        saveOutbox(userId, pruned);
        setPendingOutboxCount(pruned.length);
      }
    },
    [cloudActive, tryRemoteOrQueue, userId],
  );

  const addEntry = useCallback(
    async (input: {
      kind: EntryKind;
      title: string;
      amount: number;
      progressAmount: number;
      contactId: string | null;
      tags: string[];
      date: string;
      note: string;
    }) => {
      const title = input.title.trim() || "Untitled";
      const paid =
        input.kind === "payment"
          ? input.amount
          : Math.max(
              0,
              Math.min(
                input.amount,
                Number.isFinite(input.progressAmount)
                  ? input.progressAmount
                  : 0,
              ),
            );
      const note = input.note.trim();
      const tags = [
        ...new Set(input.tags.map((t) => t.trim()).filter(Boolean)),
      ];
      const dateIso = input.date;
      const amount = Math.max(0, input.amount);

      if (cloudActive && userId) {
        if (navigator.onLine) {
          try {
            const entry = await apiAddEntry({
              kind: input.kind,
              title,
              amount,
              progressAmount: paid,
              contactId: input.contactId,
              tags,
              dateIso,
              note,
            });
            serverIdsRef.current.entries.add(entry.id);
            setState((s) => ({ ...s, entries: [entry, ...s.entries] }));
            return;
          } catch (e) {
            console.error(e);
          }
        }
        const localId = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const contactLocalId = input.contactId;
        appendOutbox(userId, {
          v: 1,
          kind: "entry.add",
          localId,
          entryKind: input.kind,
          title,
          amount,
          progressAmount: paid,
          contactLocalId,
          tags,
          dateIso,
          note,
          createdAt,
        });
        setPendingOutboxCount(loadOutbox(userId).length);
        const localEntry: Entry = {
          id: localId,
          kind: input.kind,
          title,
          amount,
          progressAmount: paid,
          contactId: input.contactId,
          tags,
          date: dateIso,
          note,
          createdAt,
        };
        setState((s) => ({ ...s, entries: [localEntry, ...s.entries] }));
        return;
      }

      const entry: Entry = {
        id: crypto.randomUUID(),
        kind: input.kind,
        title,
        amount,
        progressAmount: paid,
        contactId: input.contactId,
        tags,
        date: dateIso,
        note,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, entries: [entry, ...s.entries] }));
    },
    [cloudActive, userId],
  );

  const updateEntryProgress = useCallback(
    async (id: string, progressAmount: number) => {
      let nextVal = 0;
      let skip = false;
      setState((s) => {
        const e = s.entries.find((x) => x.id === id);
        if (!e || e.kind === "payment") {
          skip = true;
          return s;
        }
        nextVal = Math.max(0, Math.min(e.amount, progressAmount));
        return {
          ...s,
          entries: s.entries.map((x) =>
            x.id === id ? { ...x, progressAmount: nextVal } : x,
          ),
        };
      });

      if (skip || !cloudActive || !userId) return;

      const onServer = serverIdsRef.current.entries.has(id);
      const op: OutboxOp = {
        v: 1,
        kind: "entry.progress",
        entryId: id,
        progressAmount: nextVal,
      };

      if (!onServer) {
        appendOutbox(userId, op);
        setPendingOutboxCount(loadOutbox(userId).length);
        return;
      }

      if (navigator.onLine) {
        try {
          await apiUpdateEntryProgress(id, nextVal);
        } catch (e) {
          console.error(e);
          appendOutbox(userId, op);
          setPendingOutboxCount(loadOutbox(userId).length);
        }
      } else {
        appendOutbox(userId, op);
        setPendingOutboxCount(loadOutbox(userId).length);
      }
    },
    [cloudActive, userId],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      const isServerEntry = serverIdsRef.current.entries.has(id);

      setState((s) => ({
        ...s,
        entries: s.entries.filter((e) => e.id !== id),
      }));

      if (!cloudActive || !userId) return;

      if (isServerEntry) {
        serverIdsRef.current.entries.delete(id);
        await tryRemoteOrQueue(
          { v: 1, kind: "entry.remove", entryId: id },
          async () => {
            await apiRemoveEntry(id);
          },
        );
      } else {
        const pruned = pruneOutboxForDeletedLocalEntry(loadOutbox(userId), id);
        saveOutbox(userId, pruned);
        setPendingOutboxCount(pruned.length);
      }
    },
    [cloudActive, tryRemoteOrQueue, userId],
  );

  const signOut = useCallback(async () => {
    clearLedgerAuthBackup();
    await nextAuthSignOut({ redirect: false });
  }, []);

  const ready = authReady && dataReady;

  const value: LedgerContextValue = {
    ready,
    syncEnabled,
    user,
    networkOnline,
    pendingOutboxCount,
    syncBusy,
    syncError,
    resync,
    state,
    contactsById,
    addContact,
    removeContact,
    addEntry,
    updateEntryProgress,
    removeEntry,
    totals,
    signOut,
  };

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
}

export function usePayLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) {
    throw new Error("usePayLedger must be used within PayLedgerProvider");
  }
  return ctx;
}

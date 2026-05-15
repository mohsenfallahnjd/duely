import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contact, Entry, EntryKind, PayState } from "@/lib/types";

type ContactRow = {
  id: string;
  name: string;
  accent: string;
  phone: string | null;
  created_at: string;
};

type EntryRow = {
  id: string;
  kind: EntryKind;
  title: string;
  amount: string | number;
  progress_amount: string | number;
  contact_id: string | null;
  tags: string[] | null;
  entry_date: string;
  note: string | null;
  created_at: string;
};

function mapContact(r: ContactRow): Contact {
  return {
    id: r.id,
    name: r.name,
    accent: r.accent,
    phone: r.phone ?? undefined,
  };
}

function mapEntry(r: EntryRow): Entry {
  const raw =
    typeof r.entry_date === "string" && r.entry_date.length === 10
      ? `${r.entry_date}T12:00:00.000Z`
      : new Date(r.entry_date).toISOString();

  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    amount: Number(r.amount),
    progressAmount: Number(r.progress_amount),
    contactId: r.contact_id,
    tags: r.tags ?? [],
    date: raw,
    note: r.note ?? "",
    createdAt: r.created_at,
  };
}

export async function fetchLedger(supabase: SupabaseClient): Promise<PayState> {
  const [cRes, eRes] = await Promise.all([
    supabase.from("contacts").select("*").order("created_at", { ascending: true }),
    supabase.from("entries").select("*").order("created_at", { ascending: false }),
  ]);

  if (cRes.error) throw cRes.error;
  if (eRes.error) throw eRes.error;

  return {
    contacts: ((cRes.data ?? []) as ContactRow[]).map(mapContact),
    entries: ((eRes.data ?? []) as EntryRow[]).map(mapEntry),
  };
}

export async function remoteAddContact(
  supabase: SupabaseClient,
  name: string,
  accent: string,
  phone?: string | null,
): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      name,
      accent,
      phone: phone?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapContact(data as ContactRow);
}

export async function remoteRemoveContact(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function remoteAddEntry(
  supabase: SupabaseClient,
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
  const entryDate = input.dateIso.slice(0, 10);
  const { data, error } = await supabase
    .from("entries")
    .insert({
      kind: input.kind,
      title: input.title,
      amount: input.amount,
      progress_amount: input.progressAmount,
      contact_id: input.contactId,
      tags: input.tags,
      entry_date: entryDate,
      note: input.note,
    })
    .select()
    .single();

  if (error) throw error;
  return mapEntry(data as EntryRow);
}

export async function remoteUpdateEntryProgress(
  supabase: SupabaseClient,
  id: string,
  progressAmount: number,
): Promise<void> {
  const { error } = await supabase
    .from("entries")
    .update({ progress_amount: progressAmount })
    .eq("id", id);

  if (error) throw error;
}

export async function remoteRemoveEntry(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

"use client";

import { useMemo, useState } from "react";
import { AuthBar } from "@/components/auth-bar";
import { usePayLedger } from "@/components/pay-ledger-provider";
import { SyncStatusBanner } from "@/components/sync-status-banner";
import { KIND_META, POPULAR_TAGS } from "@/lib/constants";
import type { EntryKind } from "@/lib/types";
import { TomanAmount } from "@/components/toman-icon";
import {
  collectAllTags,
  computeTagPaymentShares,
  tagSpendPercent,
} from "@/lib/tag-stats";
import { cn } from "@/lib/cn";
import { EntryCard } from "@/components/entry-card";
import { PersianDateField } from "@/components/persian-date-field";
import {
  canUseDeviceContacts,
  pickDeviceContacts,
} from "@/lib/device-contacts";
import {
  Calendar,
  List,
  LoaderCircle,
  MoreHorizontal,
  PlusCircle,
  Smartphone,
  Sparkles,
  Tag,
  Wallet,
} from "@/components/icons";
import { Link } from "@/components/link";

type Filter = "all" | EntryKind;
type NavTab = "list" | "add" | "more";

export function PayDashboard() {
  const {
    ready,
    user,
    syncEnabled,
    state,
    contactsById,
    addContact,
    removeContact,
    addEntry,
    updateEntryProgress,
    removeEntry,
    totals,
  } = usePayLedger();

  const [nav, setNav] = useState<NavTab>("list");
  const [filter, setFilter] = useState<Filter>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState("");
  const [contactImportBusy, setContactImportBusy] = useState(false);

  const [kind, setKind] = useState<EntryKind>("payment");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [progressAmount, setProgressAmount] = useState("");
  const [contactId, setContactId] = useState<string>("");
  const [date, setDate] = useState(() => new Date().toISOString());
  const [note, setNote] = useState("");
  const [pickedTags, setPickedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  const { totalPayments, byTag: tagPaymentByTag } = useMemo(
    () => computeTagPaymentShares(state.entries),
    [state.entries],
  );

  const allTagsInLedger = useMemo(
    () => collectAllTags(state.entries),
    [state.entries],
  );

  const filtered = useMemo(() => {
    let list =
      filter === "all"
        ? state.entries
        : state.entries.filter((e) => e.kind === filter);
    if (tagFilter) {
      list = list.filter((e) =>
        e.tags.some((tg) => tg.trim() === tagFilter),
      );
    }
    return list;
  }, [state.entries, filter, tagFilter]);

  const activeTagSpend = tagFilter ? tagPaymentByTag.get(tagFilter) ?? 0 : 0;
  const activeTagPercent = tagSpendPercent(totalPayments, activeTagSpend);

  function toggleTag(tag: string) {
    setPickedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const prog =
      kind === "payment"
        ? amt
        : Number(progressAmount) >= 0
          ? Number(progressAmount)
          : 0;
    try {
      await addEntry({
        kind,
        title,
        amount: amt,
        progressAmount: prog,
        contactId: contactId || null,
        tags: pickedTags,
        date: new Date(date).toISOString(),
        note,
      });
    } catch (err) {
      console.error(err);
      return;
    }
    setTitle("");
    setAmount("");
    setProgressAmount("");
    setNote("");
    setPickedTags([]);
    setCustomTag("");
    setNav("list");
  }

  function addCustomTag() {
    const t = customTag.trim();
    if (!t) return;
    if (!pickedTags.includes(t)) setPickedTags((p) => [...p, t]);
    setCustomTag("");
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-zinc-500">
        <LoaderCircle className="size-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading your ledger…</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl px-4 pt-12 sm:px-6 sm:pt-14",
        "pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]",
      )}
    >
      <SyncStatusBanner />
      {nav === "list" && (
        <>
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              PayMay
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              Ledger
            </h1>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              Payments, debts, and pending amounts — with tags and contacts.
            </p>
          </header>

          <section className="mb-6 grid gap-2 sm:grid-cols-3">
            <SummaryCard
              label="Payments"
              value={totals.payments}
              className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/90 to-white dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-zinc-950"
              icon={<Wallet className="size-4 text-indigo-600 dark:text-indigo-400" />}
            />
            <SummaryCard
              label="Debt left"
              value={totals.debtOutstanding}
              className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 to-white dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-zinc-950"
              icon={
                <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" />
              }
            />
            <SummaryCard
              label="Pending"
              value={totals.pendingOutstanding}
              className="border-amber-200/60 bg-gradient-to-br from-amber-50/90 to-white dark:border-amber-900/50 dark:from-amber-950/40 dark:to-zinc-950"
              icon={<Wallet className="size-4 text-amber-600 dark:text-amber-400" />}
            />
          </section>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["all", "payment", "debt", "pending"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  filter === k
                    ? "bg-zinc-900 text-white shadow-md dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
                )}
              >
                {k === "all"
                  ? "All"
                  : k === "payment"
                    ? "Payment"
                    : k === "debt"
                      ? "Debt"
                      : "Pending"}
              </button>
            ))}
          </div>

          {allTagsInLedger.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Tags
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setTagFilter(null)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    tagFilter === null
                      ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
                  )}
                >
                  All tags
                </button>
                {allTagsInLedger.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setTagFilter((prev) => (prev === t ? null : t))
                    }
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      tagFilter === t
                        ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-100"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {tagFilter && totalPayments > 0 && (
                <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {tagFilter}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">
                    {activeTagPercent.toFixed(1)}% of payment spend
                  </span>
                  <span>·</span>
                  <TomanAmount
                    value={activeTagSpend}
                    className="text-xs font-medium"
                  />
                </p>
              )}
              {tagFilter && totalPayments <= 0 && (
                <p className="text-xs text-zinc-500">
                  No payment entries yet — add tagged payments to see share of
                  spend.
                </p>
              )}
            </div>
          )}

          <section className="space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
                <Wallet className="mx-auto size-10 text-zinc-400" />
                <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {tagFilter
                    ? `No entries with tag “${tagFilter}”`
                    : "No entries yet"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {tagFilter
                    ? "Clear the tag filter or pick another tag."
                    : "Add one from the Add tab."}
                </p>
                <button
                  type="button"
                  onClick={() => (tagFilter ? setTagFilter(null) : setNav("add"))}
                  className="mt-5 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
                >
                  {tagFilter ? "Show all tags" : "Add entry"}
                </button>
              </div>
            ) : (
              filtered.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  contact={
                    entry.contactId
                      ? contactsById.get(entry.contactId)
                      : undefined
                  }
                  onDelete={(id) => void removeEntry(id)}
                  onProgressChange={updateEntryProgress}
                  activeTag={tagFilter}
                  onTagClick={(t) => {
                    setTagFilter((prev) => (prev === t ? null : t));
                    setNav("list");
                  }}
                />
              ))
            )}
          </section>
        </>
      )}

      {nav === "add" && (
        <>
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              PayMay
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Add entry
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Choose type, amount, Jalali date, and optional contact.
            </p>
          </header>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-5 rounded-3xl border border-zinc-200/80 bg-white/80 p-5 shadow-lg backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/70 sm:p-6"
          >
            <div className="flex flex-wrap gap-2">
              {(["payment", "debt", "pending"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-left text-sm transition",
                    kind === k
                      ? "border-indigo-500 bg-indigo-50/90 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-100"
                      : "border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300",
                  )}
                >
                  <span className="block font-semibold">
                    {KIND_META[k].label}
                  </span>
                  <span className="block text-xs opacity-80">
                    {KIND_META[k].hint}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Title
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Groceries, Loan, Invoice #12"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none ring-0 transition focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {kind === "payment" ? "Amount spent" : "Total amount"}
                <input
                  required
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              {kind !== "payment" && (
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:col-span-2">
                  {kind === "debt"
                    ? "Already paid toward this debt"
                    : "Already settled / received"}
                  <input
                    inputMode="decimal"
                    value={progressAmount}
                    onChange={(e) => setProgressAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </label>
              )}
              <div className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <span className="mb-1.5 flex items-center gap-1">
                  <Calendar className="size-3.5" /> Date (Jalali)
                </span>
                <PersianDateField valueIso={date} onChange={setDate} />
              </div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:col-span-2">
                Contact
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="">No contact</option>
                  {state.contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setNav("more")}
                  className="mt-2 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Manage contacts & import → More tab
                </button>
              </label>
            </div>

            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <Tag className="size-3.5" /> Tags
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {POPULAR_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      pickedTags.includes(t)
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  placeholder="Custom tag"
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="shrink-0 rounded-xl border border-zinc-200 px-3 text-sm font-medium dark:border-zinc-800"
                >
                  Add
                </button>
              </div>
            </div>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Note (optional)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-[0.99]"
            >
              Save to ledger
            </button>
          </form>
        </>
      )}

      {nav === "more" && (
        <>
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              PayMay
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              More
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Account, contacts, sync, and appearance.
            </p>
          </header>

          <div className="mb-6 space-y-4">
            <AuthBar />
            <Link
              href="https://vercel.com"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700"
            >
              <Sparkles className="size-3.5 text-indigo-500" />
              Ready for Vercel
            </Link>
          </div>

          <div className="mb-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Contacts
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Contact name"
                className="min-w-[140px] flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
              <button
                type="button"
                onClick={() => {
                  void addContact(newContactName);
                  setNewContactName("");
                }}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Add
              </button>
              <button
                type="button"
                disabled={!canUseDeviceContacts() || contactImportBusy}
                onClick={() => {
                  void (async () => {
                    setContactImportBusy(true);
                    try {
                      const picks = await pickDeviceContacts();
                      for (const p of picks) {
                        await addContact(p.name, { phone: p.phone });
                      }
                    } finally {
                      setContactImportBusy(false);
                    }
                  })();
                }}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200",
                )}
              >
                {contactImportBusy ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Smartphone className="size-3.5" />
                )}
                Import from device
              </button>
            </div>
            {!canUseDeviceContacts() && (
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Device contacts are not available in this browser (often needs
                Chrome/Android over HTTPS).
              </p>
            )}
            <ul className="mt-4 max-h-48 space-y-1 overflow-auto rounded-xl border border-zinc-200/80 bg-white/50 p-2 text-sm dark:border-zinc-800 dark:bg-zinc-950/50">
              {state.contacts.length === 0 ? (
                <li className="px-2 py-4 text-center text-xs text-zinc-500">
                  No contacts yet — add one above.
                </li>
              ) : (
                state.contacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <span className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: c.accent }}
                        />
                        <span className="truncate">{c.name}</span>
                      </span>
                      {c.phone && (
                        <span
                          className="ps-4 text-[11px] text-zinc-500 sm:ps-0 dark:text-zinc-400"
                          dir="ltr"
                        >
                          {c.phone}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => void removeContact(c.id)}
                      className="shrink-0 text-xs text-red-600 hover:underline dark:text-red-400"
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <p className="text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
            {user && syncEnabled
              ? "Signed in — your ledger is stored in your Supabase project (per-account, row-level security)."
              : syncEnabled
                ? "Sign in to sync contacts and entries to your account. Until then, data stays in this browser only."
                : "Add Supabase env keys and run the migration SQL to enable register / login and cloud sync. Until then, data stays in local storage."}
          </p>
        </>
      )}

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/90 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95",
          "pb-[env(safe-area-inset-bottom,0px)]",
        )}
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2 pt-1.5">
          {(
            [
              { id: "list" as const, label: "List", Icon: List },
              { id: "add" as const, label: "Add", Icon: PlusCircle },
              { id: "more" as const, label: "More", Icon: MoreHorizontal },
            ] satisfies { id: NavTab; label: string; Icon: typeof List }[]
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setNav(id)}
              className={cn(
                "flex min-w-[4.5rem] flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-colors",
                nav === id
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              <Icon
                className={cn(
                  "size-6",
                  nav === id && "text-indigo-600 dark:text-indigo-400",
                )}
                strokeWidth={nav === id ? 2.25 : 1.75}
              />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  className,
  icon,
}: {
  label: string;
  value: number;
  className?: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
          {label}
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
        <TomanAmount
          value={value}
          className="text-xl font-semibold tracking-tight sm:text-2xl"
        />
      </p>
    </div>
  );
}

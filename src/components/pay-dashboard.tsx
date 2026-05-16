"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  useState,
} from "react";
import { AuthBar } from "@/components/auth-bar";
import { usePayLedger } from "@/components/pay-ledger-provider";
import { SyncStatusBanner } from "@/components/sync-status-banner";
import {
  KIND_META,
  POPULAR_TAGS,
  SHOW_SETTLED_STORAGE_KEY,
} from "@/lib/constants";
import { isEntryFullySettled } from "@/lib/entry-helpers";
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
  getContactPickerSnapshot,
  pickDeviceContacts,
  SERVER_CONTACT_PICKER_SNAPSHOT,
  subscribeContactPickerAvailability,
} from "@/lib/device-contacts";
import { parseVCardContent } from "@/lib/vcard-import";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  Info,
  List,
  LoaderCircle,
  MoreHorizontal,
  PlusCircle,
  Smartphone,
  Tag,
  Upload,
  Wallet,
} from "@/components/icons";
import { LedgerLoadingSplash } from "@/components/ledger-loading-splash";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  formatAmountInputFromRaw,
  parseAmountInputToNumber,
} from "@/lib/amount-input";
import { tomanToPersianWords } from "@/lib/persian-amount-words";

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
  const [contactImportKind, setContactImportKind] = useState<
    "device" | "vcf" | null
  >(null);
  const [contactImportNotice, setContactImportNotice] = useState<string | null>(
    null,
  );
  const contactPicker = useSyncExternalStore(
    subscribeContactPickerAvailability,
    getContactPickerSnapshot,
    () => SERVER_CONTACT_PICKER_SNAPSHOT,
  );
  const vcfInputRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<EntryKind>("payment");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [progressAmount, setProgressAmount] = useState("");
  const [contactId, setContactId] = useState<string>("");
  const [date, setDate] = useState(() => new Date().toISOString());
  const [note, setNote] = useState("");
  const [pickedTags, setPickedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [showSettledItems, setShowSettledItems] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        if (localStorage.getItem(SHOW_SETTLED_STORAGE_KEY) === "1") {
          setShowSettledItems(true);
        }
      } catch {
        /* ignore */
      }
    });
  }, []);

  const { totalPayments, byTag: tagPaymentByTag } = useMemo(
    () => computeTagPaymentShares(state.entries),
    [state.entries],
  );

  const allTagsInLedger = useMemo(
    () => collectAllTags(state.entries),
    [state.entries],
  );

  const baseFiltered = useMemo(() => {
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

  const filtered = useMemo(() => {
    if (showSettledItems) return baseFiltered;
    return baseFiltered.filter((e) => !isEntryFullySettled(e));
  }, [baseFiltered, showSettledItems]);

  const emptyBecauseSettledOnly =
    !showSettledItems &&
    baseFiltered.length > 0 &&
    filtered.length === 0;

  const activeTagSpend = tagFilter ? tagPaymentByTag.get(tagFilter) ?? 0 : 0;
  const activeTagPercent = tagSpendPercent(totalPayments, activeTagSpend);

  const amountVerbal = useMemo(() => {
    const n = parseAmountInputToNumber(amount);
    if (amount === "" || !Number.isFinite(n) || n <= 0) return null;
    return `${tomanToPersianWords(Math.trunc(n))} تومان`;
  }, [amount]);

  const progressVerbal = useMemo(() => {
    if (kind === "payment") return null;
    const n = parseAmountInputToNumber(progressAmount);
    if (progressAmount === "" || !Number.isFinite(n) || n < 0) return null;
    return `${tomanToPersianWords(Math.trunc(n))} تومان`;
  }, [kind, progressAmount]);

  function toggleTag(tag: string) {
    setPickedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseAmountInputToNumber(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const prog =
      kind === "payment"
        ? amt
        : Math.max(0, parseAmountInputToNumber(progressAmount) || 0);
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
    return <LedgerLoadingSplash />;
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl px-4 pt-12 sm:px-6 sm:pt-14",
        "pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]",
      )}
    >
      {nav === "list" && (
        <>
          <SyncStatusBanner />
          <header className="mb-4 sm:mb-6">
            <div className="flex items-start justify-between gap-3 sm:block">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 sm:text-xs">
                  PayMay
                </p>
                <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-white sm:mt-1 sm:text-2xl sm:text-3xl">
                  Ledger
                </h1>
              </div>
              <details className="relative shrink-0 sm:hidden">
                <summary
                  className={cn(
                    "flex cursor-pointer list-none items-center justify-center rounded-lg border border-zinc-200/90 bg-white/90 p-1.5 text-zinc-500 shadow-sm outline-none transition",
                    "hover:border-zinc-300 hover:text-zinc-700 active:scale-[0.97]",
                    "dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200",
                    "[&::-webkit-details-marker]:hidden",
                  )}
                >
                  <Info className="size-3.5 shrink-0" aria-hidden />
                  <span className="sr-only">General information about the ledger</span>
                </summary>
                <div
                  className={cn(
                    "absolute end-0 z-20 mt-2 w-[min(calc(100vw-2rem),17rem)] rounded-xl border border-zinc-200/90 bg-white/95 p-3 text-[11px] leading-relaxed text-zinc-600 shadow-lg backdrop-blur-sm",
                    "dark:border-zinc-700 dark:bg-zinc-950/95 dark:text-zinc-400",
                  )}
                >
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    How this screen works
                  </p>
                  <p className="mt-1.5 text-zinc-600 dark:text-zinc-400">
                    Track payments, debts, and money you expect to receive. Use
                    tags and contacts to organize. Fully settled debts and
                    expected-in items stay out of this list until you enable{" "}
                    <strong className="font-medium text-zinc-700 dark:text-zinc-300">
                      Show settled items
                    </strong>{" "}
                    under More.
                  </p>
                </div>
              </details>
            </div>
            <p className="mt-1.5 hidden text-sm text-zinc-600 sm:block dark:text-zinc-400">
              Payments, debts, and money you expect to receive — with tags and
              contacts.
            </p>
          </header>

          <MobileLedgerTotals
            payments={totals.payments}
            debtLeft={totals.debtOutstanding}
            expectedLeft={totals.pendingOutstanding}
          />

          <section className="mb-4 hidden gap-3 sm:mb-6 sm:grid sm:grid-cols-3">
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
              label="Expected left"
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
                {k === "all" ? "All" : KIND_META[k].label}
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
                  {emptyBecauseSettledOnly
                    ? "No active debts or expected items"
                    : tagFilter
                      ? `No entries with tag “${tagFilter}”`
                      : "No entries yet"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {emptyBecauseSettledOnly
                    ? "Fully settled rows are hidden. Turn on “Show settled items” in More, or adjust filters."
                    : tagFilter
                      ? "Clear the tag filter or pick another tag."
                      : "Add one from the Add tab."}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {emptyBecauseSettledOnly ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSettledItems(true);
                          try {
                            localStorage.setItem(
                              SHOW_SETTLED_STORAGE_KEY,
                              "1",
                            );
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
                      >
                        Show settled items
                      </button>
                      <button
                        type="button"
                        onClick={() => setNav("more")}
                        className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      >
                        More settings
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        tagFilter ? setTagFilter(null) : setNav("add")
                      }
                      className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
                    >
                      {tagFilter ? "Show all tags" : "Add entry"}
                    </button>
                  )}
                </div>
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
                  autoComplete="off"
                  value={amount}
                  onChange={(e) =>
                    setAmount(formatAmountInputFromRaw(e.target.value))
                  }
                  placeholder="0"
                  dir="ltr"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 tabular-nums"
                />
                {amountVerbal && (
                  <p
                    className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400"
                    dir="rtl"
                  >
                    {amountVerbal}
                  </p>
                )}
              </label>
              {kind !== "payment" && (
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:col-span-2">
                  {kind === "debt"
                    ? "Already paid toward this debt"
                    : "Already settled / received"}
                  <input
                    inputMode="decimal"
                    autoComplete="off"
                    value={progressAmount}
                    onChange={(e) =>
                      setProgressAmount(
                        formatAmountInputFromRaw(e.target.value),
                      )
                    }
                    placeholder="0"
                    dir="ltr"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 tabular-nums"
                  />
                  {progressVerbal && (
                    <p
                      className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400"
                      dir="rtl"
                    >
                      {progressVerbal}
                    </p>
                  )}
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
          </div>

          <div className="mb-6 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Ledger list
            </p>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Show settled items
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  When off, fully paid debts and fully received “expected in”
                  amounts are hidden from the main list (not deleted).
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showSettledItems}
                aria-label="Show settled debts and expected-in items on the main list"
                onClick={() => {
                  setShowSettledItems((prev) => {
                    const next = !prev;
                    try {
                      localStorage.setItem(
                        SHOW_SETTLED_STORAGE_KEY,
                        next ? "1" : "0",
                      );
                    } catch {
                      /* ignore */
                    }
                    return next;
                  });
                }}
                className={cn(
                  "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
                  showSettledItems
                    ? "bg-indigo-600"
                    : "bg-zinc-300 dark:bg-zinc-600",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform dark:bg-zinc-50",
                    showSettledItems && "translate-x-[1.375rem]",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Appearance
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Light or dark mode
              </span>
              <ThemeToggle variant="segment" />
            </div>
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
              <input
                ref={vcfInputRef}
                id="paymay-vcf-import"
                type="file"
                accept=".vcf,.vcard,text/vcard,text/x-vcard,application/vcard"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setContactImportNotice(null);
                  void (async () => {
                    setContactImportKind("vcf");
                    try {
                      const text = await f.text();
                      const picks = parseVCardContent(text);
                      if (picks.length === 0) {
                        setContactImportNotice(
                          "No contacts found in that file. Export from your phone as .vcf (often “Share contact” or Contacts → Export).",
                        );
                        return;
                      }
                      for (const p of picks) {
                        await addContact(p.name, { phone: p.phone });
                      }
                    } finally {
                      setContactImportKind(null);
                    }
                  })();
                }}
              />
              <button
                type="button"
                disabled={
                  !contactPicker.available || contactImportKind !== null
                }
                onClick={() => {
                  setContactImportNotice(null);
                  void (async () => {
                    setContactImportKind("device");
                    try {
                      const picks = await pickDeviceContacts();
                      for (const p of picks) {
                        await addContact(p.name, { phone: p.phone });
                      }
                    } finally {
                      setContactImportKind(null);
                    }
                  })();
                }}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200",
                )}
              >
                {contactImportKind === "device" ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Smartphone className="size-3.5" />
                )}
                Pick from device
              </button>
              <button
                type="button"
                disabled={contactImportKind !== null}
                onClick={() => {
                  setContactImportNotice(null);
                  vcfInputRef.current?.click();
                }}
                aria-controls="paymay-vcf-import"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900 disabled:opacity-50 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-100",
                )}
              >
                {contactImportKind === "vcf" ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                Import .vcf file
              </button>
            </div>
            {contactImportNotice && (
              <p
                className="mt-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200/90"
                role="status"
              >
                {contactImportNotice}
              </p>
            )}
            {!contactPicker.available &&
              (contactPicker.reason === "insecure" ||
                contactPicker.hint.length > 0) && (
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                  {contactPicker.reason === "insecure"
                    ? "Connection not secure."
                    : "Built-in contact picker isn’t available here."}
                </span>{" "}
                {contactPicker.hint}{" "}
                <span className="text-zinc-500 dark:text-zinc-400">
                  On iPhone or desktop, export contacts to a{" "}
                  <strong className="font-medium text-zinc-600 dark:text-zinc-300">
                    .vcf
                  </strong>{" "}
                  file and tap{" "}
                  <strong className="font-medium">Import .vcf file</strong>.
                </span>
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
              ? "Signed in — your ledger is stored in Postgres (scoped to your account on the server)."
              : syncEnabled
                ? "Sign in to sync contacts and entries to your account. Until then, data stays in this browser only."
                : "Set DATABASE_URL and AUTH_SECRET (and run db:push) to enable register / login and cloud sync. Until then, data stays in local storage."}
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

function MobileLedgerTotals({
  payments,
  debtLeft,
  expectedLeft,
}: {
  payments: number;
  debtLeft: number;
  expectedLeft: number;
}) {
  return (
    <section
      className="mb-4 sm:hidden"
      aria-label="Ledger totals"
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm",
          "dark:border-zinc-800/90 dark:bg-zinc-950/90 dark:shadow-none",
        )}
      >
        <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800">
          <div className="flex min-h-0 flex-col items-center gap-1 px-1.5 py-3 text-center">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-xl",
                "bg-indigo-100 text-indigo-700",
                "dark:bg-indigo-500/20 dark:text-indigo-200",
              )}
            >
              <ArrowDownRight className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="max-w-[5.5rem] text-[9px] font-semibold uppercase leading-tight tracking-wide text-zinc-500 dark:text-zinc-400">
              Spend
            </span>
            <TomanAmount
              value={payments}
              className="max-w-full min-w-0 justify-center text-[0.8125rem] font-bold leading-tight tracking-tight text-zinc-900 dark:text-white [&_svg]:size-[0.85em]"
            />
          </div>
          <div className="flex min-h-0 flex-col items-center gap-1 px-1.5 py-3 text-center">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-xl",
                "bg-emerald-100 text-emerald-700",
                "dark:bg-emerald-500/15 dark:text-emerald-300",
              )}
            >
              <CreditCard className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="max-w-[5.5rem] text-[9px] font-semibold uppercase leading-tight tracking-wide text-zinc-500 dark:text-zinc-400">
              Debt left
            </span>
            <TomanAmount
              value={debtLeft}
              className="max-w-full min-w-0 justify-center text-[0.8125rem] font-bold leading-tight tracking-tight text-zinc-900 dark:text-white [&_svg]:size-[0.85em]"
            />
          </div>
          <div className="flex min-h-0 flex-col items-center gap-1 px-1.5 py-3 text-center">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-xl",
                "bg-amber-100 text-amber-800",
                "dark:bg-amber-500/15 dark:text-amber-200",
              )}
            >
              <ArrowUpRight className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="max-w-[5.5rem] text-[9px] font-semibold uppercase leading-tight tracking-wide text-zinc-500 dark:text-zinc-400">
              Expected
            </span>
            <TomanAmount
              value={expectedLeft}
              className="max-w-full min-w-0 justify-center text-[0.8125rem] font-bold leading-tight tracking-tight text-zinc-900 dark:text-white [&_svg]:size-[0.85em]"
            />
          </div>
        </div>
      </div>
    </section>
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

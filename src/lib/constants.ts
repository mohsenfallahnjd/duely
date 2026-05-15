import type { EntryKind } from "./types";

export const STORAGE_KEY = "pay-may-state-v1";

export const POPULAR_TAGS = [
  "Food",
  "Transport",
  "Bills",
  "Rent",
  "Shopping",
  "Health",
  "Entertainment",
  "Subscriptions",
  "Coffee",
  "Transfer",
  "Salary",
  "Other",
] as const;

export const ACCENT_PRESETS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#22c55e",
  "#3b82f6",
  "#eab308",
] as const;

export const KIND_META: Record<
  EntryKind,
  { label: string; short: string; hint: string }
> = {
  payment: {
    label: "Payment",
    short: "Out",
    hint: "Money you paid or spent today.",
  },
  debt: {
    label: "Debt",
    short: "Owe",
    hint: "Amount you owe — track payoff progress.",
  },
  pending: {
    label: "Pending",
    short: "Due",
    hint: "Money expected or not yet settled.",
  },
};

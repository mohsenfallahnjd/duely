"use client";

import { X } from "lucide-react";
import { useCalendar } from "./calendar-context";
import type { CalendarType } from "@/lib/calendar";
import { cn } from "@/lib/cn";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { cal, setCal } = useCalendar();

  const options: { value: CalendarType; label: string; sub: string }[] = [
    { value: "gregorian", label: "Gregorian", sub: "Jan · Feb · Mar …" },
    { value: "jalali", label: "Jalali (Shamsi)", sub: "فروردین · اردیبهشت · خرداد …" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">Calendar</p>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCal(opt.value)}
              className={cn(
                "w-full flex items-center justify-between rounded-2xl border px-4 py-3.5 transition text-left",
                cal === opt.value
                  ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500",
              )}
            >
              <div>
                <div className={cn("font-medium text-sm", cal === opt.value ? "text-white dark:text-zinc-900" : "text-zinc-900 dark:text-white")}>
                  {opt.label}
                </div>
                <div className={cn("text-xs mt-0.5", cal === opt.value ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400 dark:text-zinc-500")}>
                  {opt.sub}
                </div>
              </div>
              {cal === opt.value && (
                <div className="w-2 h-2 rounded-full bg-white dark:bg-zinc-900 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

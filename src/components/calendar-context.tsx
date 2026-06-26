"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { CalendarType } from "@/lib/calendar";

export type Lang = "en" | "fa";

type Ctx = {
  cal: CalendarType;
  lang: Lang;
  currency: string;
  setCal: (c: CalendarType) => void;
  setLang: (l: Lang) => void;
  setCurrency: (c: string) => void;
};

const CalendarContext = createContext<Ctx>({
  cal: "gregorian", lang: "en", currency: "USD",
  setCal: () => {}, setLang: () => {}, setCurrency: () => {},
});

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [cal, setCal] = useState<CalendarType>("gregorian");
  const [lang, setLang] = useState<Lang>("en");
  const [currency, setCurrency] = useState("USD");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const c = localStorage.getItem("duely-calendar") as CalendarType | null;
    if (c === "jalali" || c === "gregorian") setCal(c);
    const l = localStorage.getItem("duely-lang") as Lang | null;
    if (l === "en" || l === "fa") setLang(l);
    const cur = localStorage.getItem("duely-currency");
    if (cur) setCurrency(cur);
    setMounted(true);
  }, []);

  if (!mounted) return <PageSkeleton />;

  return (
    <CalendarContext.Provider value={{
      cal, lang, currency,
      setCal: (c) => { setCal(c); localStorage.setItem("duely-calendar", c); },
      setLang: (l) => { setLang(l); localStorage.setItem("duely-lang", l); },
      setCurrency: (c) => { setCurrency(c); localStorage.setItem("duely-currency", c); },
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 animate-pulse">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-14" />
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-32 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}

export function useCalendar() { return useContext(CalendarContext); }

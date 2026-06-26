"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    const c = localStorage.getItem("duely-calendar") as CalendarType | null;
    if (c === "jalali" || c === "gregorian") setCal(c);
    const l = localStorage.getItem("duely-lang") as Lang | null;
    if (l === "en" || l === "fa") setLang(l);
    const cur = localStorage.getItem("duely-currency");
    if (cur) setCurrency(cur);
  }, []);

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

export function useCalendar() { return useContext(CalendarContext); }

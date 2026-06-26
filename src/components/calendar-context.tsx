"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CalendarType } from "@/lib/calendar";

type Settings = {
  cal: CalendarType;
  currency: string;
};

type SettingsCtx = Settings & {
  setCal: (c: CalendarType) => void;
  setCurrency: (c: string) => void;
};

const CalendarContext = createContext<SettingsCtx>({
  cal: "gregorian",
  currency: "USD",
  setCal: () => {},
  setCurrency: () => {},
});

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [cal, setCal] = useState<CalendarType>("gregorian");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    const savedCal = localStorage.getItem("duely-calendar") as CalendarType | null;
    if (savedCal === "jalali" || savedCal === "gregorian") setCal(savedCal);
    const savedCurrency = localStorage.getItem("duely-currency");
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  function setCalPersist(c: CalendarType) { setCal(c); localStorage.setItem("duely-calendar", c); }
  function setCurrencyPersist(c: string) { setCurrency(c); localStorage.setItem("duely-currency", c); }

  return (
    <CalendarContext.Provider value={{ cal, currency, setCal: setCalPersist, setCurrency: setCurrencyPersist }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() { return useContext(CalendarContext); }

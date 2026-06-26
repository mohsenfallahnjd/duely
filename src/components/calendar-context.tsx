"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CalendarType } from "@/lib/calendar";

const CalendarContext = createContext<{
  cal: CalendarType;
  setCal: (c: CalendarType) => void;
}>({ cal: "gregorian", setCal: () => {} });

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [cal, setCal] = useState<CalendarType>("gregorian");
  useEffect(() => {
    const saved = localStorage.getItem("duely-calendar") as CalendarType | null;
    if (saved === "jalali" || saved === "gregorian") setCal(saved);
  }, []);
  function set(c: CalendarType) {
    setCal(c);
    localStorage.setItem("duely-calendar", c);
  }
  return <CalendarContext.Provider value={{ cal, setCal: set }}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  return useContext(CalendarContext);
}

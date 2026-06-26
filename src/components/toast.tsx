"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ToastItem = { id: number; msg: string; type: "success" | "error" };
type ToastCtx = { toast: (msg: string, type?: "success" | "error") => void };

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 inset-x-0 flex flex-col items-center gap-2 z-[100] pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              t.type === "error"
                ? "bg-red-500 text-white"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

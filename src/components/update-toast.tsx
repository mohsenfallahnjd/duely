"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function UpdateToast() {
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setReg((e as CustomEvent<ServiceWorkerRegistration>).detail);
    };
    window.addEventListener("sw-update-ready", handler);
    return () => window.removeEventListener("sw-update-ready", handler);
  }, []);

  if (!reg) return null;

  function applyUpdate() {
    setUpdating(true);
    reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <div className="fixed bottom-20 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-2xl max-w-sm w-full">
        <RefreshCw className={`w-4 h-4 shrink-0 ${updating ? "animate-spin" : ""}`} />
        <span className="text-sm font-medium flex-1">Update available</span>
        <button
          type="button"
          onClick={applyUpdate}
          disabled={updating}
          className="text-sm font-bold underline underline-offset-2 disabled:opacity-50"
        >
          {updating ? "Updating…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}

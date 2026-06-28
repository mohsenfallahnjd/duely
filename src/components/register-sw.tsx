"use client";

import { useEffect } from "react";

const enableSw =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_ENABLE_OFFLINE_SW === "1";

function notifyUpdateReady(reg: ServiceWorkerRegistration) {
  window.dispatchEvent(new CustomEvent("sw-update-ready", { detail: reg }));
}

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !enableSw) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        if (reg.waiting) {
          notifyUpdateReady(reg);
          return;
        }

        reg.addEventListener("updatefound", () => {
          const newSw = reg.installing;
          if (!newSw) return;
          newSw.addEventListener("statechange", () => {
            if (newSw.state === "installed" && navigator.serviceWorker.controller) {
              notifyUpdateReady(reg);
            }
          });
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      } catch {
        // silent
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", () => void register(), { once: true });
  }, []);

  return null;
}

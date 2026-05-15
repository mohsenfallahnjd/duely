"use client";

import { useEffect } from "react";

const enableSw =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_ENABLE_OFFLINE_SW === "1";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !enableSw
    ) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

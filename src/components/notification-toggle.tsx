"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

export function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setEnabled(Notification.permission === "granted");
  }, []);

  async function toggle() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Push notifications not supported in this browser.");
      return;
    }
    setLoading(true);
    try {
      if (enabled) {
        setEnabled(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") { setLoading(false); return; }
        const reg = await navigator.serviceWorker.ready;
        const vapidRes = await fetch("/api/push/vapid-public-key");
        if (!vapidRes.ok) { alert("Push not configured on server."); setLoading(false); return; }
        const { key } = await vapidRes.json();
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
        setEnabled(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!("Notification" in (typeof window !== "undefined" ? window : {}))) return null;

  return (
    <button
      onClick={() => void toggle()}
      disabled={loading}
      title={enabled ? "Disable notifications" : "Enable notifications"}
      className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition disabled:opacity-50"
    >
      {enabled ? <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <BellOff className="w-4 h-4" />}
    </button>
  );
}

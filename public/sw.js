/* global caches, fetch, self */
const CACHE = "qist-v1";

const PRECACHE = ["/", "/login", "/register", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(PRECACHE.map((p) => cache.add(new Request(p, { credentials: "same-origin" })).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k.startsWith("qist-")).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Qist", {
      body: data.body || "",
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "qist-reminder",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length) return clients[0].focus();
      return self.clients.openWindow("/");
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname === "/api/auth/session") {
      event.respondWith(
        caches.open(CACHE).then(async (cache) => {
          try {
            const res = await fetch(request);
            if (res.ok) await cache.put(request, res.clone());
            return res;
          } catch {
            const hit = await cache.match(request);
            return hit ?? new Response(JSON.stringify({ user: null, expires: null }), { status: 200, headers: { "Content-Type": "application/json" } });
          }
        })
      );
    }
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) await cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        try {
          const res = await fetch(request);
          if (res.ok) await cache.put(request, res.clone());
          return res;
        } catch {
          const fallback = await cache.match("/");
          return fallback ?? new Response("Offline", { status: 503 });
        }
      })
    );
  }
});

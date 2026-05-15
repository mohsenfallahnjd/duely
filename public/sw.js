/* global caches, fetch, self */
/**
 * PayMay offline shell — precache core pages + Next static chunks; replay
 * last successful /api/auth/session when offline so JWT users keep userId → cloud mirror loads.
 */
const CACHE = "paymay-offline-v1";

/** URLs to warm on install (best-effort; ignored if one fails). */
const PRECACHE = [
  "/",
  "/login",
  "/register",
  "/paymay-icon.svg",
  "/manifest.webmanifest",
  "/apple-icon",
];

function sameOrigin(url) {
  return url.origin === self.location.origin;
}

function isSessionGet(url) {
  return (
    url.pathname === "/api/auth/session" ||
    url.pathname.startsWith("/api/auth/session/")
  );
}

function isNextStatic(url) {
  return url.pathname.startsWith("/_next/static/");
}

/** Minimal body if session was never cached (avoids breaking useSession parser). */
function emptySessionResponse() {
  return new Response(
    JSON.stringify({ user: null, expires: null }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=0",
      },
    },
  );
}

async function precacheAll(cache) {
  await Promise.all(
    PRECACHE.map((path) =>
      cache.add(new Request(path, { credentials: "same-origin" })).catch(
        () => {},
      ),
    ),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(precacheAll)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k.startsWith("paymay-offline-"))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!sameOrigin(url)) return;

  // APIs except session: let them fail (ledger uses local mirror + outbox).
  if (url.pathname.startsWith("/api/") && !isSessionGet(url)) {
    return;
  }

  if (isSessionGet(url)) {
    event.respondWith(
      (async () => {
        const c = await caches.open(CACHE);
        try {
          const res = await fetch(request);
          if (res.ok) await c.put(request, res.clone());
          return res;
        } catch {
          const hit = await c.match(request);
          if (hit) return hit;
          return emptySessionResponse();
        }
      })(),
    );
    return;
  }

  if (isNextStatic(url)) {
    event.respondWith(
      (async () => {
        const c = await caches.open(CACHE);
        const hit = await c.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res.ok) await c.put(request, res.clone());
          return res;
        } catch {
          return hit || new Response("", { status: 504, statusText: "Offline" });
        }
      })(),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const c = await caches.open(CACHE);
        try {
          const res = await fetch(request);
          if (res.ok) await c.put(request, res.clone());
          return res;
        } catch {
          const fallback = await c.match("/");
          if (fallback) return fallback;
          return new Response("Offline — open PayMay online once to cache it.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      })(),
    );
  }
});

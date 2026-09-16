/**
 * IBF service worker — deliberately conservative.
 *
 * The previous version was cache-first for every request, which is the classic
 * way to pin returning users to a stale app: once "/" was cached they never saw
 * an update. This one is network-first and only falls back to the cache when
 * the network fails, so a deploy is picked up on the next load.
 *
 * Never cached: anything under /api/ (responses are per-user and must not be
 * shared between accounts), authenticated navigations rendered by the server,
 * and non-GET requests.
 *
 * Bump CACHE_VERSION on any change here to evict the old cache on activate.
 */
const CACHE_VERSION = "ibf-v2";
const PRECACHE = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // A failed precache must not block activation.
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only successful, cacheable responses are stored. A 307 redirect to
        // sign-in must never be cached, or a signed-out page would be served
        // to a signed-in user.
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") {
            return new Response(
              "<!doctype html><meta charset=utf-8><title>Offline</title>" +
                "<body style=\"margin:0;min-height:100vh;display:grid;place-items:center;" +
                "background:#0a0f1e;color:#f4f7fb;font-family:system-ui,sans-serif;text-align:center\">" +
                "<div><p style=\"color:#00f5d4;font-size:11px;letter-spacing:.2em;font-weight:700\">IBF</p>" +
                "<h1 style=\"font-size:24px;margin:.6rem 0 0\">You are offline</h1>" +
                "<p style=\"color:#8290a4;margin-top:.75rem\">Reconnect and try again.</p></div>",
              { headers: { "content-type": "text/html; charset=utf-8" }, status: 503 },
            );
          }
          return Response.error();
        }),
      ),
  );
});

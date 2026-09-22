/* Lingo Town service worker: offline app shell.
 * - Pages and RSC payloads: network first, then cache, then /offline.
 * - Build assets, fonts, icons: cache first (they are content-hashed).
 * - Everything else same-origin: stale-while-revalidate.
 */
const VERSION = "lt-v1";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const PRECACHE = ["/", "/phrasebook", "/me", "/offline", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(new Request(u, { cache: "reload" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isImmutable = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname.startsWith("/splash/") ||
  /\.(woff2?|png|svg)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages and React Server Component payloads: always try the network first.
  const isPage = request.mode === "navigate";
  if (isPage || request.headers.get("RSC") === "1") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(request)) || (isPage ? caches.match("/offline") : Response.error())),
    );
    return;
  }

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(RUNTIME).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    }),
  );
});

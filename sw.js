/* ═══════════════════════════════════════════════════════════════════════
   INELT · service worker

   Deliberately conservative, because this site runs live timed exams:

   - HTML is ALWAYS fetched from the network first. A student never sits a
     stale copy of the exam page, and a deploy takes effect immediately.
     The cache is only a fallback for when the network fails.
   - Only same-origin static assets (CSS, icons, the manifest) are served
     cache-first, and they are refreshed in the background.
   - Anything that touches Supabase — auth, questions, grading — is never
     cached and never even inspected. It goes straight to the network.

   Bump CACHE_VERSION whenever the cached shell changes.
   ═══════════════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'inelt-v15';
const SHELL = [
  '/welcome',
  '/login',
  '/',
  '/css/inelt-theme.css',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon-32.png',
  '/icons/favicon-64.png',
  '/icons/logo.png',
  '/icons/emblem.png',
  '/icons/emblem-tinted.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // addAll rejects the whole batch if any single request fails, which
      // would leave the worker uninstalled — cache each entry on its own.
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never touch anything that carries exam or account data.
  if (url.hostname.endsWith('supabase.co')) return;
  // Leave other cross-origin requests (fonts, CDN scripts) to the browser.
  if (url.origin !== self.location.origin) return;

  // ── HTML: network first, cache only as an offline fallback ──
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('/welcome')))
    );
    return;
  }

  // ── Static assets: serve from cache, refresh in the background ──
  event.respondWith(
    caches.match(req).then(hit => {
      const network = fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});

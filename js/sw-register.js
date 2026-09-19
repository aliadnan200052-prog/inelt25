/* Register the service worker so the site can be installed to the home
   screen. Wrapped in a guard: if registration fails the site carries on
   exactly as before.

   This used to sit inline on every page. It lives here so that no page
   needs 'unsafe-inline' in its script-src: an injected <script> or
   onerror= then simply does not run. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

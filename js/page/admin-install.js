/* ════════════════════════════════════════════════════════════════════════
   «Install» — the dashboard as its own icon on the home screen.

   /admin carries its own manifest (/admin-manifest.json): the same site
   and the same service worker, but its own id, its own start_url and its
   own icon. So installing from here adds the dashboard BESIDE the
   student app, not instead of it, and opening it lands on /admin rather
   than on the exam home.

   Chrome, Edge and Samsung Internet fire beforeinstallprompt, and the
   button hands that event straight back — one tap, no instructions.
   Safari has no such API at all, so there the button says the gesture.
   A browser that cannot install (Firefox) never shows a button rather
   than promising something that will not happen.
   ════════════════════════════════════════════════════════════════════════ */
(() => {
  const btn  = document.getElementById('installBtn');
  const hint = document.getElementById('installHint');
  if (!btn || !hint) return;

  /* Already running from the home screen — the button would be telling
     someone to do what they have done. */
  const standalone = () =>
    (window.matchMedia && (matchMedia('(display-mode: standalone)').matches ||
                           matchMedia('(display-mode: window-controls-overlay)').matches)) ||
    navigator.standalone === true;
  if (standalone()) return;

  const ua = navigator.userAgent || '';
  // iPadOS 13+ reports itself as a Mac, and a touch-capable Mac is an iPad.
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const MENU_STEPS = 'In Chrome or Edge: open the ⋮ menu → “Install app”. Firefox cannot install.';
  const IOS_STEPS  = 'In Safari: tap Share → “Add to Home Screen”. Other iPhone browsers cannot.';

  let deferred = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();            // keep Chrome's own mini-bar out of the way
    deferred = e;
    hint.hidden = true;
    btn.textContent = 'Install app';
    btn.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    btn.hidden = true;
    hint.hidden = true;
  });

  // Safari can install, but only by hand and with no event to wait for.
  if (isIOS) {
    btn.textContent = 'Add to Home Screen';
    btn.hidden = false;
  }

  btn.addEventListener('click', async () => {
    if (!deferred) {
      hint.textContent = isIOS ? IOS_STEPS : MENU_STEPS;
      hint.hidden = false;
      return;
    }
    const e = deferred;
    deferred = null;               // the event can only be used once
    try {
      e.prompt();
      const { outcome } = await e.userChoice;
      if (outcome === 'accepted') { btn.hidden = true; hint.hidden = true; }
      else btn.textContent = 'Install app';
    } catch (err) {
      hint.textContent = MENU_STEPS;
      hint.hidden = false;
    }
  });
})();

/* ── the dashboard's three tabs ────────────────────────────────────────────
   A tab only rewrites an attribute on the page, so nothing navigates: the
   bar never unmounts, and the address bar keeps showing a bare "/" with no
   file name and no #hash. The links still point at "/" so that opening one
   in a new tab, or losing this script, lands somewhere sensible.

   Coming back from /practice, which view to open is handed over in
   sessionStorage for the same reason — a #hash would show. */
(() => {
  const VIEWS = ['home', 'practice', 'study'];
  const tabs  = document.querySelectorAll('.dash-tab');

  const show = (view, moved) => {
    if (VIEWS.indexOf(view) < 0) view = 'home';
    document.body.dataset.dash = view;
    if (moved) document.body.classList.add('dash-moved');
    tabs.forEach(t => {
      if (t.classList.contains('dash-tab-' + view)) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
  };

  document.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;   // let it open elsewhere
    e.preventDefault();
    show(el.dataset.go, true);
    window.scrollTo({ top: 0, behavior:
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));

  // A link saved, or a page cached, from back when the tabs used a hash.
  // Honour it, then wipe it off the address bar.
  const fromHash = () => {
    const m = /^#dash(Home|Practice|Study)$/.exec(location.hash);
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    return m ? m[1].toLowerCase() : '';
  };
  addEventListener('hashchange', () => { const v = fromHash(); if (v) show(v, true); });

  // Arriving from another page of the site.
  let want = '';
  try {
    want = sessionStorage.getItem('dashView') || '';
    sessionStorage.removeItem('dashView');
  } catch (err) { /* private mode: fall back to the home view */ }
  show(want || fromHash(), false);
})();

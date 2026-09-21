/* ════════════════════════════════════════════════════════════════════════
   Network state, and how the app talks about it.

   Two jobs, both small:

   1. A bar at the top of every page while the device has no network. The
      app otherwise looks completely normal offline — the dashboard renders
      from the cached shell and the session in localStorage — so a student
      could sit there pressing a button that cannot work and be told
      nothing.

      navigator.onLine only knows whether the device has a network at all:
      a café wifi that never reaches the internet still reads as online. So
      this catches the ordinary cases (wifi off, mobile data off, flight
      mode) and is a hint, not a guarantee. The failure messages below are
      what cover the rest.

   2. One place that turns an error into a sentence a student can read.
      Before this, a dropped connection showed "TypeError: Failed to fetch"
      in the middle of an Arabic alert.
   ════════════════════════════════════════════════════════════════════════ */

window.humanError = function (err) {
  const raw = String((err && err.message) || err || '');

  if (!navigator.onLine ||
      /failed to fetch|networkerror|network request failed|load failed|err_internet/i.test(raw))
    return 'لا يوجد اتصال بالإنترنت. تحقّق من الشبكة وحاول مرة أخرى.';
  if (/timeout|timed out|aborted/i.test(raw))
    return 'استغرق الاتصال وقتاً طويلاً. حاول مرة أخرى.';

  // The handful of Supabase auth replies a student actually meets.
  if (/invalid login credentials/i.test(raw))     return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (/already registered|already exists/i.test(raw)) return 'هذا البريد الإلكتروني مسجَّل مسبقاً.';
  if (/email not confirmed/i.test(raw))           return 'لم يتم تأكيد بريدك الإلكتروني بعد — راجع رسائلك.';
  if (/password should be at least/i.test(raw))   return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
  if (/rate limit|too many requests/i.test(raw))  return 'محاولات كثيرة خلال وقت قصير. انتظر قليلاً ثم حاول مجدداً.';

  return '';   // unknown: the caller keeps its own wording
};

(() => {
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>' +
    '<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>' +
    '<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>' +
    '<line x1="12" y1="20" x2="12.01" y2="20"/></svg>';

  let bar = null;
  const paint = () => {
    const off = !navigator.onLine;
    document.documentElement.classList.toggle('is-offline', off);
    if (!document.body) return;
    // Back online: take the bar out. Leaving it in place meant it stayed on
    // screen until the page was reloaded — and once the class went, so did
    // the padding holding the page clear of it, so it covered the top.
    if (!off) { if (bar && bar.isConnected) bar.remove(); return; }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'offlineBar';
      bar.setAttribute('role', 'status');
      bar.setAttribute('aria-live', 'polite');
      // A fixed literal, not anything a user or the question bank supplies.
      bar.innerHTML = ICON + '<span>لا يوجد اتصال بالإنترنت</span>';
    }
    if (!bar.isConnected) document.body.appendChild(bar);
  };

  addEventListener('online', paint);
  addEventListener('offline', paint);
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', paint);
  else paint();
})();

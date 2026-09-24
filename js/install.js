/* ════════════════════════════════════════════════════════════════════════
   «ثبّت التطبيق» — the site is already a PWA (manifest + service worker);
   this is the part that tells people so.

   Three cases, because the browsers differ:

   1. Chrome, Edge, Samsung Internet (Android and desktop) fire
      beforeinstallprompt. The event is stashed and the card's button
      hands it straight back — one tap, no instructions.
   2. Safari on iPhone and iPad never fires it and has no API at all:
      adding to the home screen is a manual gesture, so the card opens a
      sheet showing it.
   3. Anything else (Firefox, an in-app browser) can't install. The sheet
      says which browser to open instead rather than pretending.

   The sheet always carries all three sets of steps with the detected one
   selected, so nobody is stranded by a wrong guess about their device.
   ════════════════════════════════════════════════════════════════════════ */
(() => {
  const slot = document.getElementById('installSlot');
  if (!slot) return;

  /* Already installed: the card would be telling someone to do what they
     have done. display-mode covers Android and desktop, navigator.standalone
     is the iOS equivalent. */
  const installed = () =>
    (window.matchMedia && (matchMedia('(display-mode: standalone)').matches ||
                           matchMedia('(display-mode: window-controls-overlay)').matches)) ||
    navigator.standalone === true;

  const KEY = 'inelt.install.hidden';
  const MONTH = 30 * 24 * 60 * 60 * 1000;
  const hidden = () => {
    try {
      const t = Number(localStorage.getItem(KEY) || 0);
      return t && Date.now() - t < MONTH;
    } catch (e) { return false; }   // private mode: just show it
  };
  const remember = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} };

  const ua = navigator.userAgent || '';
  // iPadOS 13+ reports itself as a Mac, and a touch-capable Mac is an iPad.
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';

  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();          // keep Chrome's own mini-bar out of the way
    deferred = e;
    paint();
  });
  window.addEventListener('appinstalled', () => { deferred = null; remember(); paint(); });

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  const SHARE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 3v13"/><path d="m8 7 4-4 4 4"/>' +
    '<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  const DOTS_ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/>' +
    '<circle cx="12" cy="19" r="1.7"/></svg>';
  const PLUS_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>';

  const GUIDES = {
    ios: {
      tab: 'آيفون · آيباد',
      note: 'من متصفح Safari. متصفحات آيفون الأخرى لا تستطيع إضافة التطبيق للشاشة الرئيسية.',
      steps: [
        { icon: SHARE_ICON, ar: 'اضغط زر المشاركة', sub: 'في شريط Safari أسفل الشاشة' },
        { icon: PLUS_ICON,  ar: 'اختر «إضافة إلى الشاشة الرئيسية»', sub: 'Add to Home Screen — انزل قليلاً في القائمة' },
        { icon: '',         ar: 'اضغط «إضافة»', sub: 'تظهر أيقونة INELT مع بقية تطبيقاتك' }
      ]
    },
    android: {
      tab: 'أندرويد',
      note: 'من متصفح Chrome أو Samsung Internet.',
      steps: [
        { icon: DOTS_ICON, ar: 'افتح قائمة المتصفح', sub: 'الثلاث نقاط في الأعلى' },
        { icon: PLUS_ICON, ar: 'اختر «تثبيت التطبيق»', sub: 'أو «إضافة إلى الشاشة الرئيسية»' },
        { icon: '',        ar: 'اضغط «تثبيت»', sub: 'يفتح بعدها كأي تطبيق، بلا شريط متصفح' }
      ]
    },
    desktop: {
      tab: 'حاسوب',
      note: 'من متصفح Chrome أو Edge. Firefox لا يدعم التثبيت.',
      steps: [
        { icon: PLUS_ICON, ar: 'اضغط أيقونة التثبيت في شريط العنوان', sub: 'في يمين الشريط، بجانب النجمة' },
        { icon: DOTS_ICON, ar: 'أو من القائمة ← «تثبيت INELT»', sub: 'Install INELT' },
        { icon: '',        ar: 'يُفتح في نافذته الخاصة', sub: 'وتلقى أيقونته مع برامجك' }
      ]
    }
  };

  /* ── the card ──────────────────────────────────────────────────── */
  /* «كيف؟» opens the steps; «تثبيت» hands the browser's own prompt back.
     Which one it says follows whether we are holding that event. */
  const relabel = () => {
    const go = document.getElementById('instGo');
    if (go) go.textContent = deferred ? 'تثبيت' : 'كيف؟';
  };

  function paint() {
    if (installed() || hidden()) { slot.innerHTML = ''; return; }
    /* Already drawn. Chrome fires beforeinstallprompt after the first
       paint far more often than before it, so this is the path that turns
       «كيف؟» into a real one-tap install — not a no-op. */
    if (slot.firstChild) return relabel();
    slot.innerHTML =
      `<div class="inst-card">
         <svg class="inst-art" viewBox="0 0 96 76" fill="none" aria-hidden="true">
           <ellipse cx="50" cy="69" rx="30" ry="4.5" fill="var(--primary)" fill-opacity=".12"/>
           <rect x="30" y="8" width="40" height="58" rx="8" fill="var(--surface-raised)"
                 stroke="var(--primary)" stroke-width="2.6"/>
           <rect x="36" y="16" width="28" height="34" rx="4" fill="var(--primary)" fill-opacity=".14"/>
           <path d="M50 24v18" stroke="var(--primary)" stroke-width="2.6" stroke-linecap="round"/>
           <path d="m43 35 7 7 7-7" stroke="var(--primary)" stroke-width="2.6"
                 stroke-linecap="round" stroke-linejoin="round"/>
           <rect x="42" y="56" width="16" height="3" rx="1.5" fill="var(--primary)" fill-opacity=".45"/>
         </svg>
         <div class="inst-text">
           <div class="inst-t">ثبّت INELT على جهازك</div>
           <div class="inst-s">يفتح كأي تطبيق، بلا شريط متصفح، ويشتغل حتى بدون إنترنت</div>
         </div>
         <button type="button" class="btn btn-primary inst-go" id="instGo">${deferred ? 'تثبيت' : 'كيف؟'}</button>
         <button type="button" class="inst-x" id="instX" aria-label="إخفاء">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
         </button>
       </div>`;
  }

  /* ── the sheet ─────────────────────────────────────────────────── */
  let sheet = null;
  function openSheet(which) {
    const pick = which || platform;
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.className = 'inst-wrap';
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-label', 'تثبيت التطبيق');
      document.body.appendChild(sheet);
    }
    const g = GUIDES[pick];
    sheet.innerHTML =
      `<div class="inst-scrim" data-close="1"></div>
       <div class="inst-sheet">
         <div class="inst-head">
           <div class="inst-head-t">ثبّت INELT</div>
           <button type="button" class="inst-x" data-close="1" aria-label="إغلاق">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                  stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
           </button>
         </div>
         <div class="inst-tabs" role="tablist">
           ${Object.keys(GUIDES).map(k =>
             `<button type="button" class="inst-tab${k === pick ? ' on' : ''}" role="tab"
                      aria-selected="${k === pick}" data-tab="${k}">${esc(GUIDES[k].tab)}</button>`).join('')}
         </div>
         <ol class="inst-steps">
           ${g.steps.map((s, n) =>
             `<li class="inst-step">
                <span class="inst-n en">${n + 1}</span>
                <span class="inst-step-b">
                  <span class="inst-step-t">${esc(s.ar)}${s.icon ? `<span class="inst-ic">${s.icon}</span>` : ''}</span>
                  <span class="inst-step-s">${esc(s.sub)}</span>
                </span>
              </li>`).join('')}
         </ol>
         <p class="inst-note">${esc(g.note)}</p>
         ${deferred ? '<button type="button" class="btn btn-primary btn-block" id="instNow">تثبيت الآن</button>' : ''}
       </div>`;
    document.documentElement.classList.add('inst-open');
    const x = sheet.querySelector('[data-close]');
    if (x && x.focus) x.focus();
  }

  function closeSheet() {
    if (sheet) sheet.innerHTML = '';
    document.documentElement.classList.remove('inst-open');
  }

  async function install() {
    if (!deferred) return openSheet();
    const e = deferred;
    deferred = null;              // the event can only be used once
    closeSheet();
    try {
      e.prompt();
      const { outcome } = await e.userChoice;
      if (outcome === 'accepted') { remember(); paint(); }
      else relabel();
    } catch (err) {
      console.error('install prompt failed:', err);
      relabel();
      openSheet();
    }
  }

  /* One delegated listener: the card is redrawn and the sheet is built on
     demand, so nothing here holds a reference to an element that goes. */
  document.addEventListener('click', e => {
    if (e.target.closest('#instGo'))  return deferred ? install() : openSheet();
    if (e.target.closest('#instNow')) return install();
    if (e.target.closest('#instX'))   { remember(); paint(); slot.innerHTML = ''; return; }
    if (e.target.closest('[data-close]')) return closeSheet();
    const tab = e.target.closest('.inst-tab[data-tab]');
    if (tab) return openSheet(tab.dataset.tab);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  paint();
})();

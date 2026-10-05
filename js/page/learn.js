/* ════════════════════════════════════════════════════════════════════════
   المسار — the page.

   A sitting is a dozen questions, built fresh each time: whatever is due
   for review first, oldest first, then new material from the unit the
   learner is furthest through. Review before new, always — there is no
   point meeting a twentieth word while the first five are slipping.

   Nothing here calls Supabase. No attempt is created and attempts_used is
   never read or written: this is study, not an exam.
   ════════════════════════════════════════════════════════════════════════ */
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  const UNITS = (window.LEARN_VOCAB && window.LEARN_VOCAB.units) || [];
  const SITTING = 12;

  /* One flat index, so an id found in the review queue can be turned back
     into the entry and the unit it came from. */
  const INDEX = new Map();
  UNITS.forEach(u => u.words.forEach(e => INDEX.set(u.id + ':' + e.w, { entry: e, unit: u })));

  const KIND_AR = { words: 'كلمات', phrases: 'عبارات', idioms: 'تعابير', functions: 'وظائف لغوية' };
  const KIND_ORDER = ['words', 'phrases', 'idioms', 'functions'];
  const ICONS = {
    words: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    phrases: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    idioms: '<svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.2V17h6v-1.3c0-.8.4-1.6 1-2.2A6 6 0 0 0 12 3z"/><path d="M9 21h6"/></svg>',
    functions: '<svg viewBox="0 0 24 24"><path d="M8 10h8"/><path d="M8 14h5"/><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/></svg>'
  };

  const kindOf = u => u.kind || 'words';
  const idsOf  = u => u.words.map(e => u.id + ':' + e.w);

  /* How far through a unit the learner is: an entry counts once it has
     been met, and counts double once it is known. */
  function unitProgress(u) {
    const ids = idsOf(u);
    let met = 0, known = 0;
    ids.forEach(id => {
      const it = LearnStore.item(id);
      if (it.seen > 0 || it.due > 0) met++;
      if (it.level >= LearnStore.PRODUCE_FROM) known++;
    });
    /* The bar follows what has been MET and the figure beside it what is
       known. A bar driven by "known" alone stays at nothing for the first
       week — true, and useless as feedback. */
    return { total: ids.length, met, known, pct: Math.round(met / ids.length * 100) };
  }

  /* ── the path ───────────────────────────────────────────────────── */
  function paintPath() {
    const st = LearnStore.stats();
    $('statKnown').textContent    = st.known;
    $('statLearning').textContent = st.learning;
    $('statDue').textContent      = st.due;

    const plan = planSitting();
    const reviews = plan.filter(p => p.isReview).length;
    const fresh   = plan.length - reviews;
    $('todayT').textContent = plan.length ? `${plan.length} سؤالاً` : 'خلصت كل شيء اليوم';
    $('todayS').textContent = plan.length
      ? (reviews ? `${reviews} للمراجعة` : 'لا مراجعة اليوم') + (fresh ? ` · ${fresh} جديد` : '')
      : 'ارجع غداً، أو افتح أي وحدة وتمرّن عليها.';
    $('startToday').disabled = plan.length === 0;

    const groups = {};
    UNITS.forEach(u => { const k = kindOf(u); (groups[k] = groups[k] || []).push(u); });
    $('groups').innerHTML = KIND_ORDER.filter(k => groups[k]).map(k =>
      `<div class="ln-group-t">${esc(KIND_AR[k])}</div>
       <div class="ln-units">${groups[k].map(u => {
         const p = unitProgress(u);
         return `<button type="button" class="ln-unit" data-unit="${esc(u.id)}" data-kind="${esc(k)}">
            <span class="ln-unit-ic">${ICONS[k]}</span>
            <span class="ln-unit-main">
              <span class="ln-unit-n">${esc(u.ar)}</span>
              <span class="ln-unit-s">${p.known} من ${p.total} تعرفها</span>
              <span class="ln-unit-bar"><span class="ln-unit-fill" style="width:${p.pct}%"></span></span>
            </span>
            <span class="ln-unit-go">${p.pct}%</span>
          </button>`;
       }).join('')}</div>`).join('');
  }

  /* ── choosing what to ask ───────────────────────────────────────── */
  function planSitting(onlyUnit) {
    const pool = onlyUnit ? [onlyUnit] : UNITS;
    const ids = pool.flatMap(idsOf);
    const due = LearnStore.due(ids).map(id => ({ id, isReview: true }));
    const out = due.slice(0, SITTING);
    if (out.length >= SITTING) return out;

    /* New material, taken from one unit at a time so a sitting stays on
       one subject rather than scattering across the whole bank. */
    for (const u of pool) {
      if (out.length >= SITTING) break;
      for (const id of idsOf(u)) {
        if (out.length >= SITTING) break;
        const it = LearnStore.item(id);
        if (it.seen === 0 && it.due === 0) out.push({ id, isReview: false });
      }
    }
    return out;
  }

  /* ── a sitting ──────────────────────────────────────────────────── */
  let plan = [], at = 0, right = 0, answered = false, current = null;

  function begin(unit) {
    plan = planSitting(unit);
    if (!plan.length) return;
    at = 0; right = 0;
    $('path').classList.add('hidden');
    $('summary').classList.add('hidden');
    $('sitting').classList.remove('hidden');
    askOne();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function askOne() {
    const step = plan[at];
    const found = INDEX.get(step.id);
    if (!found) { nextStep(); return; }
    const it = LearnStore.item(step.id);
    current = LearnExercises.build(found.entry, found.unit, it.level, (at + 1) * 7919 + step.id.length);
    if (!current) { nextStep(); return; }
    answered = false;

    $('lnPos').textContent   = `سؤال ${at + 1} من ${plan.length}`;
    $('lnScore').textContent = `${right} / ${at}`;
    $('lnFill').style.width  = (at / plan.length * 100) + '%';
    $('lnNext').disabled = true;
    $('lnNext').textContent = (at === plan.length - 1) ? 'إنهاء' : 'التالي';

    const body = current.typed
      ? `<input class="ln-input" id="lnInput" type="text" autocomplete="off"
                autocapitalize="off" spellcheck="false" dir="ltr" placeholder="اكتب هنا">
         ${current.hint ? `<div class="ln-hint">${esc(current.hint)}</div>` : ''}
         <div class="ln-actions" style="margin-top:var(--sp-5)">
           <button class="btn btn-ghost" id="lnCheck">تحقّق</button>
         </div>`
      : `<div class="ln-opts" id="lnOpts">${current.options.map((o, n) =>
          `<button type="button" class="ln-opt ${esc(current.optionsLang)}" data-n="${n}">${esc(o)}</button>`).join('')}</div>`;

    $('lnCard').innerHTML =
      `<div class="ln-ask">${esc(current.ask)}</div>
       <div class="ln-prompt ${esc(current.promptLang)}">${esc(current.prompt)}</div>
       ${body}
       <div id="lnTell"></div>`;
    if (current.typed) { const i = $('lnInput'); if (i) i.focus(); }
  }

  /* The card always says what the right answer was and what it means —
     being told "wrong" and nothing else teaches nobody anything. */
  /* Always the English and then the Arabic, whichever way round the
     question asked it. Echoing the option that was picked read as
     "الصحيح: عائلة — عائلة" when the question was the meaning itself. */
  function tell(wasRight) {
    const e = current.entry;
    $('lnTell').innerHTML =
      `<div class="ln-tell">
         ${wasRight ? '<b>صحيح.</b> ' : '<b>الصحيح:</b> '}
         <span class="en">${esc(e.w)}</span> — ${esc(e.ar)}
         ${e.lit ? `<span class="ln-tell-lit">${esc(e.lit)}</span>` : ''}
         ${e.ex && e.p !== 'fn' ? `<span class="ln-tell-lit en">${esc(e.ex)}</span>` : ''}
       </div>`;
  }

  function answer(given) {
    if (answered) return;
    answered = true;
    const wasRight = LearnExercises.check(current, given);
    if (wasRight) right++;
    LearnStore.grade(plan[at].id, wasRight);

    if (current.typed) {
      const i = $('lnInput');
      if (i) { i.classList.add(wasRight ? 'right' : 'wrong'); i.disabled = true; }
      const c = $('lnCheck'); if (c) c.disabled = true;
    } else {
      const list = $('lnOpts');
      list.classList.add('done');
      list.querySelectorAll('.ln-opt').forEach(el => {
        const n = Number(el.dataset.n);
        if (n === current.answer) el.classList.add('right');
        else if (n === given) el.classList.add('wrong');
      });
    }
    tell(wasRight);
    $('lnScore').textContent = `${right} / ${at + 1}`;
    $('lnNext').disabled = false;
  }

  function nextStep() {
    if (at < plan.length - 1) { at++; askOne(); window.scrollTo({ top: 0, behavior: 'instant' }); }
    else finish();
  }

  function finish() {
    $('sitting').classList.add('hidden');
    $('summary').classList.remove('hidden');
    const pct = Math.round(right / plan.length * 100);
    $('sumN').textContent = `${right} / ${plan.length}`;
    $('sumS').textContent =
      pct >= 80 ? 'ممتاز. ما أخطأت فيه سيعود عليك خلال يوم.'
      : pct >= 50 ? 'جيد. الكلمات التي أخطأت فيها ستتكرر أكثر حتى تثبت.'
      : 'لا بأس — ما تخطئ فيه يعود سريعاً، وهذا هو المقصود.';
    paintPath();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function toPath() {
    $('sitting').classList.add('hidden');
    $('summary').classList.add('hidden');
    $('path').classList.remove('hidden');
    paintPath();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* Events are bound here rather than with onclick= in the markup, so the
     page's script-src needs no 'unsafe-inline'. Cards are redrawn on every
     question, so those use one delegated listener on the document. */
  document.addEventListener('click', e => {
    if (e.target.closest('#startToday')) return begin(null);
    const u = e.target.closest('.ln-unit[data-unit]');
    if (u) return begin(UNITS.find(x => x.id === u.dataset.unit));
    const opt = e.target.closest('#lnOpts .ln-opt[data-n]');
    if (opt) return answer(Number(opt.dataset.n));
    if (e.target.closest('#lnCheck')) return answer(($('lnInput') || {}).value || '');
    if (e.target.closest('#lnNext')) return nextStep();
    if (e.target.closest('#againBtn')) return begin(null);
    if (e.target.closest('#backToPath')) return toPath();
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (e.target && e.target.id === 'lnInput' && !answered) { e.preventDefault(); answer(e.target.value); }
    else if (!$('lnNext').disabled && !$('sitting').classList.contains('hidden')) nextStep();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const s = localStorage.getItem('th') || 'light';
    document.documentElement.setAttribute('data-theme', s);
    paintPath();
  });
})();

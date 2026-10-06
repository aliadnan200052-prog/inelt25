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

  const VOCAB   = (window.LEARN_VOCAB   && window.LEARN_VOCAB.units)   || [];
  const GRAMMAR = (window.LEARN_GRAMMAR && window.LEARN_GRAMMAR.units) || [];
  const UNITS   = VOCAB.concat(GRAMMAR);
  const SITTING = 12;
  /* And no more than this many cards in one go. A sitting that runs to
     twenty-six cards is not an evening habit, and a track opened once is
     a track that teaches nothing. */
  const CARDS = 12;

  /* One flat index, so an id found in the review queue can be turned back
     into the entry and the unit it came from. A grammar drill is an item
     on the same ladder as a word: it is asked, graded, and comes back. */
  const INDEX = new Map();
  VOCAB.forEach(u => u.words.forEach(e => INDEX.set(u.id + ':' + e.w, { entry: e, unit: u })));
  const LESSON = new Map();
  GRAMMAR.forEach(u => u.lessons.forEach(l => {
    LESSON.set(l.id, { lesson: l, unit: u });
    l.drills.forEach((d, i) => INDEX.set(l.id + '#' + i, { drill: d, lesson: l, unit: u }));
  }));

  const isGrammar = u => u.kind === 'grammar';
  const drillIds  = l => l.drills.map((d, i) => l.id + '#' + i);

  const KIND_AR = { grammar: 'القواعد', words: 'كلمات', phrases: 'عبارات', idioms: 'تعابير', functions: 'وظائف لغوية' };
  const KIND_ORDER = ['grammar', 'words', 'phrases', 'idioms', 'functions'];
  const ICONS = {
    words: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    phrases: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    idioms: '<svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.2V17h6v-1.3c0-.8.4-1.6 1-2.2A6 6 0 0 0 12 3z"/><path d="M9 21h6"/></svg>',
    functions: '<svg viewBox="0 0 24 24"><path d="M8 10h8"/><path d="M8 14h5"/><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/></svg>',
    grammar: '<svg viewBox="0 0 24 24"><path d="M21.2 6.8a1 1 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.3a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5z"/><path d="m15 5 4 4"/></svg>',
    read: '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    /* Forward is leftward on this page. */
    go: '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>'
  };

  const kindOf = u => u.kind || 'words';
  const idsOf  = u => isGrammar(u)
    ? u.lessons.reduce((all, l) => all.concat(drillIds(l)), [])
    : u.words.map(e => u.id + ':' + e.w);

  /* How far through a unit the learner is: an entry counts once it has
     been met, and counts double once it is known. */
  function unitProgress(u) {
    if (isGrammar(u)) {
      const readDone = u.lessons.filter(l => LearnStore.isLessonDone(l.id)).length;
      const ids = idsOf(u);
      const known = ids.filter(id => LearnStore.item(id).level >= LearnStore.PRODUCE_FROM).length;
      return { total: u.lessons.length, met: readDone, known,
               pct: Math.round(readDone / u.lessons.length * 100), grammar: true,
               drills: ids.length };
    }
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

    /* Counted off the plan the sitting will actually run, cut to length
       and all — promising twelve and showing nine reads as a mistake.
       Items, not cards: five of them can arrive on one matching card. */
    const items = itemsIn(buildPlan(null));
    const reviews = items.filter(p => p.isReview).length;
    const fresh   = items.length - reviews;
    $('todayT').textContent = items.length ? `${items.length} مفردة` : 'خلصت كل شيء اليوم';
    $('todayS').textContent = items.length
      ? (reviews ? `${reviews} للمراجعة` : 'لا مراجعة اليوم') + (fresh ? ` · ${fresh} جديد` : '')
      : 'ارجع غداً، أو افتح أي وحدة وتمرّن عليها.';
    $('startToday').disabled = items.length === 0;

    const groups = {};
    UNITS.forEach(u => { const k = kindOf(u); (groups[k] = groups[k] || []).push(u); });
    $('groups').innerHTML = KIND_ORDER.filter(k => groups[k]).map(k =>
      `<div class="ln-group-t">${esc(KIND_AR[k])}</div>
       <div class="ln-units">${groups[k].map(u => {
         const p = unitProgress(u);
         const row = `<button type="button" class="ln-unit" data-unit="${esc(u.id)}" data-kind="${esc(k)}">
            <span class="ln-unit-ic">${ICONS[k]}</span>
            <span class="ln-unit-main">
              <span class="ln-unit-n">${esc(u.ar)}</span>
              <span class="ln-unit-s">${p.grammar
                 ? `${p.met} من ${p.total} دروس · ${p.drills} تمريناً`
                 : `${p.known} من ${p.total} تعرفها`}</span>
              <span class="ln-unit-bar"><span class="ln-unit-fill" style="width:${p.pct}%"></span></span>
            </span>
            <span class="ln-unit-go">${p.pct}%</span>
          </button>`;
         /* A rule read once is gone: the drills come back, the rule does
            not, and a student who wants to look something up before the
            exam has nowhere to look. So a grammar part keeps a door back
            into its lessons. */
         return p.grammar
           ? `<div class="ln-unit-pair">${row}
                <button type="button" class="ln-unit-read" data-read-unit="${esc(u.id)}">
                  ${ICONS.read}<span>اقرأ الدروس</span>
                </button>
              </div>`
           : row;
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

  /* A run of items from one unit that are all still being learned makes a
     better matching card than four separate questions: it is quicker, and
     a wrong pairing costs twice, because it also takes a meaning away
     from the word it belonged to. Known items are left alone — picking a
     word out of five proves nothing once it can be written from memory. */
  /* A new entry is shown before it is asked. Weg introduces a handful,
     then practises those same ones, and that order is the whole point:
     being asked something never seen is a guessing game, and a guess
     teaches nothing.

     The teaching card is also what puts the entry on the ladder, so it
     comes back tomorrow whether or not the first sitting went well. */
  /* Introductions go immediately before the card that uses them, not in a
     block at the front: meeting five words and then being asked about
     them ten cards later is most of the way back to not having met them.

     Runs over the GROUPED plan, so a matching card is preceded by a
     teaching card for each of its five, and a grammar drill by its lesson
     — once for the lesson, not once per question. */
  function introduce(steps) {
    const out = [];
    const taught = new Set(), read = new Set();
    const fresh = id => LearnStore.item(id).seen === 0;

    const teachOne = id => {
      if (taught.has(id) || !fresh(id)) return;
      taught.add(id); out.push({ teach: id });
    };

    steps.forEach(step => {
      if (step.match) { step.match.forEach(m => teachOne(m.id)); out.push(step); return; }
      const f = INDEX.get(step.id);
      if (!f) { out.push(step); return; }
      if (f.drill) {
        const lid = f.lesson.id;
        if (!read.has(lid) && !LearnStore.isLessonDone(lid)) {
          read.add(lid);
          const n = (PARTS.get(lid) || [[]]).length;
          for (let i = 0; i < n; i++) out.push({ read: lid, part: i, parts: n });
        }
        out.push(step); return;
      }
      teachOne(step.id);
      out.push(step);
    });
    return out;
  }

  function groupMatches(steps) {
    const out = [];
    let run = [];
    const flush = () => {
      if (run.length >= LearnExercises.MATCH_MIN) {
        out.push({ match: run.slice(0, LearnExercises.MATCH_MAX) });
        run.slice(LearnExercises.MATCH_MAX).forEach(x => out.push(x));
      } else run.forEach(x => out.push(x));
      run = [];
    };
    steps.forEach(step => {
      const f = INDEX.get(step.id);
      const pairable = f && f.entry && f.entry.p !== 'fn' &&
                       LearnStore.item(step.id).level < LearnStore.PRODUCE_FROM;
      const sameUnit = run.length && INDEX.get(run[0].id).unit === (f && f.unit);
      if (pairable && (!run.length || sameUnit)) { run.push(step); return; }
      flush();
      if (pairable) run.push(step); else out.push(step);
    });
    flush();
    return out;
  }

  /* Twelve items can arrive behind twenty-six cards once each of them is
     introduced and each rule is read first, so the ceiling is counted in
     cards. What is cut is not lost: it is still due tomorrow.

     The cut falls after a question, never inside the run of cards that
     prepares one — a lesson travels with the question it was put there
     for, and five introductions with the matching card they feed. */
  function trimToCards(steps) {
    let keep = 0, n = 0;
    for (let i = 0; i < steps.length; i++) {
      n++;
      if (steps[i].teach || steps[i].read) continue;
      /* `|| !keep` so a lesson longer than the whole budget still gets
         asked its one question rather than being read for nothing. */
      if (n <= CARDS || !keep) keep = i + 1;
      if (n >= CARDS) break;
    }
    return keep ? steps.slice(0, keep) : steps;
  }

  /* Group first, then introduce: the matching cards are formed, and each
     introduction is placed directly in front of the card it prepares the
     learner for. Then the whole thing is cut to length. */
  const buildPlan = unit => trimToCards(introduce(groupMatches(planSitting(unit))));
  const itemsIn = steps => steps.reduce((all, s) => all.concat(s.match || (s.id ? [s] : [])), []);

  /* ── reading a lesson again ─────────────────────────────────────── */
  /* Re-reading touches nothing: no grade, no ladder, and a lesson never
     read is not marked read by being looked at. It is the booklet left
     open at the right page, not a shortcut past the sitting. */
  let reviewing = null;

  function openLessons(unitId) {
    const u = GRAMMAR.find(x => x.id === unitId);
    if (!u) return;
    reviewing = unitId;
    $('path').classList.add('hidden');
    $('sitting').classList.add('hidden');
    $('summary').classList.add('hidden');
    $('lessons').classList.remove('hidden');
    $('lessonsT').textContent = u.ar;
    $('lessonsList').innerHTML = u.lessons.map((l, i) => {
      const n = (PARTS.get(l.id) || [[]]).length;
      return `<button type="button" class="ln-lesson" data-lesson="${esc(l.id)}">
          <span class="ln-lesson-i">${i + 1}</span>
          <span class="ln-lesson-main">
            <span class="ln-lesson-n">${esc(l.ar)}</span>
            <span class="ln-lesson-s">${n} ${n === 1 ? 'بطاقة' : n === 2 ? 'بطاقتان' : 'بطاقات'}${
              LearnStore.isLessonDone(l.id) ? ' · قرأته' : ''}</span>
          </span>
          <span class="ln-lesson-go">${ICONS.go}</span>
        </button>`;
    }).join('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function readLesson(lid) {
    const n = (PARTS.get(lid) || [[]]).length;
    plan = []; for (let i = 0; i < n; i++) plan.push({ read: lid, part: i, parts: n, review: true });
    at = 0; dir = 1;
    $('lessons').classList.add('hidden');
    $('sitting').classList.remove('hidden');
    askOne();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* ── a sitting ──────────────────────────────────────────────────── */
  let plan = [], at = 0, answered = false, current = null;
  let tied = 0, missed = null, sel = null;
  /* Which way the last step went, so a card that cannot be shown is
     skipped in the direction of travel rather than always forwards. */
  let dir = 1;
  const stepSize = s => (s && (s.teach || s.read) ? 0 : s && s.match ? s.match.length : 1);

  /* Cards and answers are not the same count once a card can hold five
     pairs, so the score needs its own tally — and it is read off the plan
     rather than added up as you go, because a running total counts a card
     twice the moment you can walk back over it.

     What was given is kept on the step: the answer, and how much of it
     was right. That is also what lets a card be shown again exactly as it
     was left — the ladder was told once, when the answer was given. */
  function tally() {
    let right = 0, done = 0;
    plan.forEach(st => { if (st.gave) { right += st.gave.right; done += st.gave.of; } });
    return { right, done };
  }
  function paintScore() {
    const t = tally();
    /* Nothing is being graded while a lesson is simply being read, and a
       score of 0 / 0 standing there says otherwise. */
    $('lnScore').textContent = reviewing ? '' : `${t.right} / ${t.done}`;
  }

  function begin(unit) {
    plan = buildPlan(unit);
    if (!plan.length) return;
    at = 0; dir = 1; reviewing = null;
    $('path').classList.add('hidden');
    $('lessons').classList.add('hidden');
    $('summary').classList.add('hidden');
    $('sitting').classList.remove('hidden');
    askOne();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function askOne() {
    const step = plan[at];
    if (step.read)  return askLesson(step);
    if (step.teach) return askTeach(step);
    if (step.match) return askMatch(step);
    const found = INDEX.get(step.id);
    if (!found) { move(dir); return; }
    if (found.drill) return askDrill(step, found);
    /* Built once and kept. Answering moves the item up the ladder, so
       building it again on the way back could ask a different question —
       the one that was answered must be the one that comes back. */
    if (!step.built) {
      const it = LearnStore.item(step.id);
      step.built = LearnExercises.build(found.entry, found.unit, it.level, (at + 1) * 7919 + step.id.length);
    }
    current = step.built;
    if (!current) { move(dir); return; }
    answered = false;

    header();

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
    if (restore(step)) return;
    if (current.typed) { const i = $('lnInput'); if (i) i.focus(); }
  }

  /* A card walked back to is shown as it was left: the same marks, the
     same explanation, and nothing to answer again. */
  function restore(step) {
    const g = step.gave;
    if (!g) return false;
    answered = true;
    if (current.typed) {
      const i = $('lnInput');
      if (i) { i.value = g.given; i.classList.add(g.right ? 'right' : 'wrong'); i.disabled = true; }
      const c = $('lnCheck'); if (c) c.disabled = true;
    } else {
      const list = $('lnOpts');
      if (list) {
        list.classList.add('done');
        list.querySelectorAll('.ln-opt').forEach(el => {
          const n = Number(el.dataset.n);
          if (n === current.answer) el.classList.add('right');
          else if (n === g.given) el.classList.add('wrong');
        });
      }
    }
    tell(!!g.right);
    $('lnNext').disabled = false;
    return true;
  }

  function header() {
    $('lnPos').textContent   = `بطاقة ${at + 1} من ${plan.length}`;
    paintScore();
    $('lnFill').style.width  = (at / plan.length * 100) + '%';
    $('lnBack').disabled = at === 0;
    $('lnNext').disabled = true;
    $('lnNext').textContent = (at === plan.length - 1) ? 'إنهاء' : 'التالي';
  }

  const POS_AR = {
    n: 'اسم', v: 'فعل', adj: 'صفة', adv: 'ظرف', prep: 'حرف جر', conj: 'أداة ربط',
    pron: 'ضمير', det: 'محدِّد', num: 'عدد', phr: 'عبارة', idiom: 'تعبير اصطلاحي',
    fn: 'جملة تُقال في موقف'
  };

  function askTeach(step) {
    const { entry: e } = INDEX.get(step.teach);
    current = null; answered = true;             // nothing to answer here
    header();
    $('lnNext').disabled = false;
    $('lnNext').textContent = 'التالي';

    /* Putting it on the ladder is what makes it come back — the card is
       the introduction AND the first repetition being scheduled. */
    LearnStore.introduce(step.teach);

    const when = e.p === 'fn' ? e.ex : (e.lit || '');
    $('lnCard').innerHTML =
      `<div class="ln-new">جديد</div>
       <div class="ln-teach-w en">${esc(e.w)}</div>
       <div class="ln-teach-ar">${esc(e.ar)}</div>
       <div class="ln-teach-kind">${esc(POS_AR[e.p] || '')}</div>
       ${when ? `<div class="ln-teach-when">
            <div class="ln-teach-when-k">${e.p === 'fn' ? 'متى تقولها' : 'المعنى الحرفي'}</div>
            <div class="ln-teach-when-v ${e.p === 'fn' ? 'en' : ''}">${esc(when)}</div>
          </div>` : ''}
       ${e.syn ? `<div class="ln-teach-when">
            <div class="ln-teach-when-k">بالإنكليزية تعني</div>
            <div class="ln-teach-when-v en">${esc(e.syn)}</div>
          </div>` : ''}
       ${e.ex && e.p !== 'fn' ? `<div class="ln-teach-ex">
            <div class="ln-teach-ex-en en">${esc(e.ex)}</div>
            ${e.exar ? `<div class="ln-teach-ex-ar">${esc(e.exar)}</div>` : ''}
          </div>` : ''}`;
  }

  /* A lesson is read in short cards, not in one wall of text. The
     vocabulary side introduces five words as five cards; a rule deserves
     the same pacing, and the booklet's own headings say where the breaks
     belong — a section about the present simple's negative is one card,
     its question form the next.

     Weights, because blocks are not the same size: a table is most of a
     card on its own, an example is a line. A break is taken at a block
     that can open a card — a heading, a paragraph, a table, a formula —
     so a card never starts on an example whose rule was left behind, and
     never on a heading left dangling at the foot of the one before. */
  const BLOCK_W = { p: 2, sub: 1, ex: 1, words: 2, table: 4, formula: 1, note: 1 };
  const CARD_SOFT = 6, CARD_HARD = 10, SUB_MIN = 5;
  const opensCard = b => b.t === 'sub' || b.t === 'p' || b.t === 'words' ||
                         b.t === 'table' || b.t === 'formula';

  /* Some blocks only make sense with the one before: a heading with its
     rule, a formula or a word list with the sentence that introduced it.
     A break there would leave "the verb takes this shape:" at the foot of
     one card and the shape on the next. */
  const leadsInto = (a, b) => a.t === 'sub' ||
    (a.t === 'p' && (b.t === 'formula' || b.t === 'words' || b.t === 'table'));

  function splitTeach(blocks) {
    const parts = [];
    let cur = [], w = 0;
    (blocks || []).forEach(b => {
      const held = cur.length && leadsInto(cur[cur.length - 1], b);
      const here = cur.length && opensCard(b) && (b.t === 'sub' ? w >= SUB_MIN : w >= CARD_SOFT);
      if (!held && (here || (cur.length && w >= CARD_HARD))) { parts.push(cur); cur = []; w = 0; }
      cur.push(b); w += BLOCK_W[b.t] || 1;
    });
    if (cur.length) parts.push(cur);
    return parts.length ? parts : [[]];
  }

  /* Split once at load, so the same lesson breaks in the same places
     every sitting. */
  const PARTS = new Map();
  GRAMMAR.forEach(u => u.lessons.forEach(l => PARTS.set(l.id, splitTeach(l.teach))));

  /* The lesson itself, read before any of its questions. The booklet's
     blocks are rendered as they were written — rules as paragraphs,
     formulas as a pill, examples with their Arabic, tables as tables —
     because that material was reviewed once and should not be reworded
     on its way here. */
  function blockHTML(b) {
    switch (b.t) {
      case 'p':       return `<p class="ln-g-p">${esc(b.ar)}</p>`;
      case 'sub':     return `<div class="ln-g-sub"><span>${esc(b.ar)}</span>${b.en ? `<span class="en">${esc(b.en)}</span>` : ''}</div>`;
      case 'formula': return `<div class="ln-g-formula">${esc(b.text)}</div>`;
      case 'note':    return `<div class="ln-g-note">${esc(b.ar)}</div>`;
      case 'words':   return `<div class="ln-g-words">${(b.items || []).map(w => `<span class="en">${esc(w)}</span>`).join('')}</div>`;
      case 'ex':      return `<div class="ln-g-ex"><span class="en">${esc(b.en)}</span><span class="ar">${esc(b.ar)}</span></div>`;
      case 'table':   return `<div class="ln-g-tablewrap"><table class="ln-g-table">
            <thead><tr>${(b.head || []).map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
            <tbody>${(b.rows || []).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table></div>`;
      default:        return '';
    }
  }

  function askLesson(step) {
    const { lesson } = LESSON.get(step.read);
    const parts = PARTS.get(step.read) || [lesson.teach || []];
    const i = Math.min(step.part || 0, parts.length - 1);
    const last = i === parts.length - 1;
    current = null; answered = true;
    header();
    $('lnNext').disabled = false;
    /* The button says what comes next, and after the last card of a
       lesson what comes next is the exercises. */
    $('lnNext').textContent = last ? (step.review ? 'رجوع للدروس' : 'ابدأ التمارين') : 'تابع';
    $('lnCard').innerHTML =
      `<div class="ln-new">درس${parts.length > 1 ? ` · ${i + 1} من ${parts.length}` : ''}</div>
       <div class="ln-g-title">${esc(lesson.ar)}</div>
       ${lesson.en && i === 0 ? `<div class="ln-g-en en">${esc(lesson.en)}</div>` : ''}
       <div class="ln-g-body">${parts[i].map(blockHTML).join('')}</div>`;
  }

  function askDrill(step, found) {
    const d = found.drill;
    /* A question about the RULE — whether the if-clause takes a comma,
       what the second conditional is for — is never on the exam paper; it
       is here to teach. Those are written in Arabic, and their options
       may be Arabic too, while anything the exam itself would ask stays
       in English exactly as it would appear. */
    current = {
      kind: 'drill', ask: d.lang === 'ar' ? 'سؤال عن القاعدة' : 'اختر الإجابة الصحيحة',
      prompt: d.q, promptLang: d.lang === 'ar' ? 'ar' : 'en',
      options: d.opts, optionsLang: d.optsLang === 'ar' ? 'ar' : 'en',
      answer: d.a, why: d.why || '', entry: { w: d.opts[d.a], ar: '', p: 'drill' }
    };
    answered = false;
    header();
    $('lnCard').innerHTML =
      `<div class="ln-ask">${esc(current.ask)}</div>
       <div class="ln-prompt ${esc(current.promptLang)}">${esc(current.prompt)}</div>
       <div class="ln-opts" id="lnOpts">${current.options.map((o, n) =>
         `<button type="button" class="ln-opt ${esc(current.optionsLang)}" data-n="${n}">${esc(o)}</button>`).join('')}</div>
       <div id="lnTell"></div>`;
    restore(step);
  }

  function askMatch(step) {
    const first = INDEX.get(step.match[0].id);
    if (!step.built) {
      const entries = step.match.map(x => INDEX.get(x.id).entry);
      step.built = LearnExercises.buildMatch(entries, first.unit, (at + 1) * 104729);
    }
    current = step.built;
    if (!current) { plan[at] = step.match[0]; return askOne(); }
    /* The pairs already tied are kept on the step, so walking back shows
       the card part-done rather than empty — and the ones already graded
       cannot be graded again, because a tied chip is not tappable. */
    const g = step.gave || (step.gave = { right: 0, of: 0, missed: {}, tied: [] });
    missed = g.missed; tied = g.tied.length; sel = null;
    answered = tied === current.pairs.length;
    header();
    const chip = (id, side) => {
      const p = current.byId[id];
      return `<button type="button" class="ln-chip ${side}" data-pair="${esc(id)}" data-side="${side}">` +
             esc(side === 'en' ? p.w : p.ar) + '</button>';
    };
    $('lnCard').innerHTML =
      `<div class="ln-ask">${esc(current.ask)}</div>
       <div class="ln-match" id="lnMatch">
         <div class="ln-match-col">${current.left.map(id => chip(id, 'en')).join('')}</div>
         <div class="ln-match-col">${current.right.map(id => chip(id, 'ar')).join('')}</div>
       </div>
       <div class="ln-match-left" id="lnLeft">${current.pairs.length} أزواج</div>
       <div id="lnTell"></div>`;
    if (tied) {
      $('lnMatch').querySelectorAll('.ln-chip').forEach(el => {
        if (g.tied.indexOf(el.dataset.pair) >= 0) el.classList.add('tied');
      });
      paintLeft();
    }
    if (answered) $('lnNext').disabled = false;
  }

  function paintLeft() {
    $('lnLeft').textContent = tied === current.pairs.length
      ? 'اكتملت' : `${current.pairs.length - tied} من ${current.pairs.length} باقية`;
  }

  function tapChip(el) {
    if (answered || el.classList.contains('tied')) return;
    const id = el.dataset.pair, side = el.dataset.side;
    if (!sel) { sel = { id, side, el }; el.classList.add('sel'); return; }
    if (sel.side === side) { sel.el.classList.remove('sel'); sel = { id, side, el }; el.classList.add('sel'); return; }
    sel.el.classList.remove('sel');
    if (sel.id === id) {
      [sel.el, el].forEach(x => { x.classList.add('tied'); x.classList.remove('miss'); });
      /* Right first time or not is what gets graded: a pair found after a
         wrong try is not a pair the learner knew. */
      LearnStore.grade(id, !missed[id]);
      const g = plan[at].gave;
      g.right += missed[id] ? 0 : 1; g.of++; g.tied.push(id);
      tied++;
      paintLeft();
      /* Live, not at the end: a card holding five pairs that shows 0 / 0
         while three of them are already tied reads as broken. */
      paintScore();
      if (tied === current.pairs.length) {
        answered = true;
        $('lnNext').disabled = false;
      }
    } else {
      missed[sel.id] = true; missed[id] = true;
      const a = sel.el, c = el;
      [a, c].forEach(x => x.classList.add('miss'));
      setTimeout(() => [a, c].forEach(x => x.classList.remove('miss')), 520);
    }
    sel = null;
  }

  /* The card always says what the right answer was and what it means —
     being told "wrong" and nothing else teaches nobody anything. */
  /* Always the English and then the Arabic, whichever way round the
     question asked it. Echoing the option that was picked read as
     "الصحيح: عائلة — عائلة" when the question was the meaning itself. */
  function tell(wasRight) {
    const e = current.entry;
    if (e.p === 'drill') {
      const cls = current.optionsLang === 'ar' ? '' : 'en';
      $('lnTell').innerHTML =
        `<div class="ln-tell">${wasRight ? '<b>صحيح.</b> ' : '<b>الصحيح:</b> '}
           <span class="${cls}">${esc(current.options[current.answer])}</span>
           ${current.why ? `<span class="ln-tell-lit">${esc(current.why)}</span>` : ''}</div>`;
      return;
    }
    $('lnTell').innerHTML =
      `<div class="ln-tell">
         ${wasRight ? '<b>صحيح.</b> ' : '<b>الصحيح:</b> '}
         <span class="en">${esc(e.w)}</span> — ${esc(e.ar)}
         ${e.lit ? `<span class="ln-tell-lit">حرفياً: ${esc(e.lit)}</span>` : ''}
         ${e.ex && e.p !== 'fn' ? `<span class="ln-tell-lit en">${esc(e.ex)}</span>` : ''}
       </div>`;
  }

  function answer(given) {
    if (answered) return;
    answered = true;
    const wasRight = LearnExercises.check(current, given);
    LearnStore.grade(plan[at].id, wasRight);
    plan[at].gave = { given, right: wasRight ? 1 : 0, of: 1 };

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
    paintScore();
    $('lnNext').disabled = false;
  }

  /* Forwards and backwards are the same move. Walking back changes
     nothing — no grade is given, taken away, or given twice — it only
     shows a card again. */
  function move(d) {
    const leaving = plan[at];
    /* Read, not merely opened: a lesson counts once its last card has
       been passed, so leaving halfway through brings the whole lesson
       back rather than the questions alone. */
    if (d > 0 && leaving && leaving.read && !leaving.review &&
        (leaving.part || 0) === (leaving.parts || 1) - 1)
      LearnStore.lessonDone(leaving.read);
    const n = at + d;
    if (n < 0) return move(1);                     // only reachable off a card that cannot be shown
    if (n >= plan.length) {
      if (reviewing) openLessons(reviewing);       // back to the list, not to a score
      else finish();
      return;
    }
    at = n; dir = d;
    askOne();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  const nextStep = () => move(1);
  const prevStep = () => move(-1);

  function finish() {
    $('sitting').classList.add('hidden');
    $('summary').classList.remove('hidden');
    /* A matching card holds five pairs and a teaching card holds no
       answer at all, so the total is what stepSize says — counting cards
       told a learner they had scored 8 out of 24 when there were twelve
       things in the sitting. */
    const total = plan.reduce((n, s) => n + stepSize(s), 0);
    const got = tally().right;
    const pct = Math.round(got / total * 100);
    $('sumN').textContent = `${got} / ${total}`;
    $('sumS').textContent =
      pct >= 80 ? 'ممتاز. ما أخطأت فيه سيعود عليك خلال يوم.'
      : pct >= 50 ? 'جيد. الكلمات التي أخطأت فيها ستتكرر أكثر حتى تثبت.'
      : 'لا بأس — ما تخطئ فيه يعود سريعاً، وهذا هو المقصود.';
    paintPath();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function toPath() {
    reviewing = null;
    $('sitting').classList.add('hidden');
    $('summary').classList.add('hidden');
    $('lessons').classList.add('hidden');
    $('path').classList.remove('hidden');
    paintPath();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* Events are bound here rather than with onclick= in the markup, so the
     page's script-src needs no 'unsafe-inline'. Cards are redrawn on every
     question, so those use one delegated listener on the document. */
  document.addEventListener('click', e => {
    if (e.target.closest('#startToday')) return begin(null);
    const r = e.target.closest('.ln-unit-read[data-read-unit]');
    if (r) return openLessons(r.dataset.readUnit);
    const l = e.target.closest('.ln-lesson[data-lesson]');
    if (l) return readLesson(l.dataset.lesson);
    if (e.target.closest('#lessonsBack')) return toPath();
    const u = e.target.closest('.ln-unit[data-unit]');
    if (u) return begin(UNITS.find(x => x.id === u.dataset.unit));
    const chip = e.target.closest('#lnMatch .ln-chip[data-pair]');
    if (chip) return tapChip(chip);
    const opt = e.target.closest('#lnOpts .ln-opt[data-n]');
    if (opt) return answer(Number(opt.dataset.n));
    if (e.target.closest('#lnCheck')) return answer(($('lnInput') || {}).value || '');
    if (e.target.closest('#lnBack')) return prevStep();
    if (e.target.closest('#lnNext')) return nextStep();
    if (e.target.closest('#againBtn')) return begin(null);
    if (e.target.closest('#backToPath')) return toPath();
  });
  document.addEventListener('keydown', e => {
    const typing = e.target && e.target.id === 'lnInput';
    if (e.key === 'Enter') {
      if (typing && !answered) { e.preventDefault(); answer(e.target.value); }
      else if (!$('lnNext').disabled && !$('sitting').classList.contains('hidden')) nextStep();
      return;
    }
    if (typing || $('sitting').classList.contains('hidden')) return;
    /* The page reads right to left, so the right arrow goes back. */
    if (e.key === 'ArrowRight' && !$('lnBack').disabled) { e.preventDefault(); prevStep(); }
    else if (e.key === 'ArrowLeft' && !$('lnNext').disabled) { e.preventDefault(); nextStep(); }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const s = localStorage.getItem('th') || 'light';
    document.documentElement.setAttribute('data-theme', s);
    paintPath();
  });
})();

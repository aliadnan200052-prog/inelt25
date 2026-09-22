/* ═══════════════════════════════════════════════════════════════════════
   INELT · الملزمة

   Renders /js/data/booklet.js as a reading surface: a cover, a chapter
   index, and one typeset part at a time with its own lesson index.

   Static content only — no Supabase call, no attempt, no attempts_used.
   Which parts have been read is a per-browser convenience in
   localStorage: it never leaves the device and the page renders fine
   when the store is empty or throws (private mode, cleared data).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  const B = window.BOOKLET;
  const $ = id => document.getElementById(id);

  /* Everything below reaches innerHTML, so escape it. The content ships
     with the app, but a stray < in a future lesson must never be markup. */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ── per-browser progress ─────────────────────── */
  const KEY = 'inelt.booklet.grammar';
  const store = {
    read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } },
    write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  let state = store.read();
  const isRead = i => !!(state.parts && state.parts[i]);
  const readCount = () => B.parts.reduce((n, _, i) => n + (isRead(i) ? 1 : 0), 0);

  /* ── icons ────────────────────────────────────── */
  const IC = {
    grammar: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    reading: '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    functions: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
    conversation: '<svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="22"/></svg>'
  };
  const CHEV = '<svg class="go" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
  const TICK = '<svg class="bk-done" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
  const BULB = '<svg viewBox="0 0 24 24"><path d="M9 18h6"/><path d="M10 22h4"/>' +
    '<path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>';

  const BRANCHES = [
    { k: 'grammar',      ar: 'القواعد',         en: 'Grammar',               ready: true },
    { k: 'reading',      ar: 'القراءة والفهم',  en: 'Reading Comprehension', ready: false },
    { k: 'functions',    ar: 'الوظائف اللغوية', en: 'Functions',             ready: false },
    { k: 'conversation', ar: 'الحوار',          en: 'Conversation',          ready: false }
  ];

  /* Parts cycle through the app's four section colours so the index reads
     as chapters rather than as one long row of identical cards. */
  const HUES = [
    { c: 'var(--sec-grammar)',      t: 'var(--tint-blue)' },
    { c: 'var(--sec-reading)',      t: 'var(--tint-purple)' },
    { c: 'var(--sec-functions)',    t: 'var(--tint-amber)' },
    { c: 'var(--sec-conversation)', t: 'var(--tint-green)' }
  ];
  const hue = i => HUES[i % HUES.length];

  const totals = (() => {
    let lessons = 0, qs = 0;
    B.parts.forEach(p => p.lessons.forEach(l => {
      lessons++; l.body.forEach(b => { if (b.t === 'q') qs++; });
    }));
    return { parts: B.parts.length, lessons, qs };
  })();

  let view = 'branches';
  let open = 0;

  /* ── ① cover + branches ───────────────────────── */
  function drawCover() {
    $('bkHeroSub').textContent = B.subtitle + ' — ' + B.author;
    $('bkHeroStats').innerHTML =
      `<div class="bk-stat"><b>${totals.parts}</b><span>أجزاء</span></div>` +
      `<div class="bk-stat"><b>${totals.lessons}</b><span>درساً</span></div>` +
      `<div class="bk-stat"><b>${totals.qs}</b><span>سؤالاً</span></div>`;

    const done = readCount(), pct = Math.round(done / totals.parts * 100);
    const C = 2 * Math.PI * 16;
    $('bkBranchList').innerHTML = BRANCHES.map(b => `
      <button class="bk-branch" data-k="${b.k}" ${b.ready ? '' : 'disabled'}>
        ${b.ready && done ? `<span class="bk-ring">
            <svg viewBox="0 0 40 40"><circle class="tr" cx="20" cy="20" r="16"/>
            <circle class="pr" cx="20" cy="20" r="16" stroke-dasharray="${C.toFixed(1)}"
                    stroke-dashoffset="${(C * (1 - pct / 100)).toFixed(1)}"/></svg>
            <b>${pct}%</b></span>` : ''}
        <span class="ic">${IC[b.k]}</span>
        <span class="nm">${esc(b.ar)}</span>
        <span class="en">${esc(b.en)}</span>
        <span class="meta"><i></i>${b.ready
          ? `${totals.parts} أجزاء · ${totals.lessons} درساً`
          : 'يُضاف لاحقاً'}</span>
      </button>`).join('');
  }

  /* ── ② part index ─────────────────────────────── */
  function drawIndex(filter) {
    const q = (filter || '').trim().toLowerCase();
    const rows = B.parts.map((p, i) => ({ p, i })).filter(({ p }) => !q ||
      (p.ar + ' ' + p.en + ' ' + p.lessons.map(l => l.ar + ' ' + l.en).join(' ')).toLowerCase().includes(q));

    $('bkPartList').innerHTML = rows.length ? rows.map(({ p, i }) => {
      const h = hue(i);
      const tags = p.lessons.slice(0, 3).map(l => `<span class="bk-tag">${esc(l.ar)}</span>`).join('') +
        (p.lessons.length > 3 ? `<span class="bk-tag">+${p.lessons.length - 3}</span>` : '');
      return `<button class="bk-part${isRead(i) ? ' read' : ''}" data-part="${i}"
                      style="--c:${h.c};--t:${h.t}">
        ${TICK}
        <span class="n">${p.n}</span>
        <span>
          <span class="ar">${esc(p.ar)}</span>
          <span class="en">${esc(p.en)}</span>
          <span class="tags">${tags}</span>
        </span>
        ${CHEV}
      </button>`;
    }).join('') : '<div class="bk-empty">لا توجد نتيجة مطابقة.</div>';

    const last = state.last;
    const show = typeof last === 'number' && last >= 0 && last < B.parts.length && !q;
    $('bkResume').classList.toggle('hidden', !show);
    if (show) $('bkResumeT').textContent = 'الجزء ' + B.parts[last].n + ' · ' + B.parts[last].ar;
  }

  /* ── ③ blocks ─────────────────────────────────── */
  function block(b) {
    switch (b.t) {
      case 'p':    return `<p class="bk-p">${esc(b.ar)}</p>`;
      case 'sub':  return `<div class="bk-sub"><span class="ar">${esc(b.ar)}</span>` +
                          `<span class="en">${esc(b.en)}</span></div>`;
      case 'words': return '<div class="bk-words">' +
                          b.items.map(w => `<span class="bk-word">${esc(w)}</span>`).join('') + '</div>';
      case 'ex':   return `<div class="bk-ex"><span class="en">${esc(b.en)}</span>` +
                          (b.ar ? `<span class="ar">${esc(b.ar)}</span>` : '') + '</div>';
      case 'formula': return `<div class="bk-formula">${esc(b.text)}</div>`;
      case 'note': return `<div class="bk-note">${BULB}<span>${esc(b.ar)}</span></div>`;
      case 'table': {
        const isEn = s => /^[\x00-\x7F\s]*$/.test(s);
        return '<div class="bk-table-wrap"><table class="bk-table"><thead><tr>' +
          b.head.map(h => `<th>${esc(h)}</th>`).join('') + '</tr></thead><tbody>' +
          b.rows.map(r => '<tr>' + r.map(c =>
            `<td class="${isEn(c) ? 'en' : ''}">${esc(c)}</td>`).join('') + '</tr>').join('') +
          '</tbody></table></div>';
      }
      case 'q': {
        const keys = ['A', 'B', 'C', 'D'];
        return `<div class="bk-q" data-a="${b.a}">
          <div class="bk-q-k">اختبر نفسك</div>
          <div class="bk-q-t">${esc(b.q)}</div>
          <div class="bk-opts">${b.opts.map((o, i) =>
            `<button class="bk-opt" type="button"><span class="k">${keys[i] || i + 1}</span>` +
            `<span>${esc(o)}</span></button>`).join('')}</div>
        </div>`;
      }
      default: return '';
    }
  }

  /* Consecutive examples read as one stack, so collect each run into a
     single wrapper rather than wrapping every card on its own. */
  function body(blocks) {
    let out = '', run = [];
    const flush = () => {
      if (!run.length) return;
      out += '<div class="bk-exs">' + run.join('') + '</div>';
      run = [];
    };
    blocks.forEach(b => {
      if (b.t === 'ex') run.push(block(b));
      else { flush(); out += block(b); }
    });
    flush();
    return out;
  }

  function drawPart(i) {
    open = i;
    const p = B.parts[i], h = hue(i);
    document.documentElement.style.setProperty('--bk-accent', h.c);
    document.documentElement.style.setProperty('--bk-tint', h.t);

    $('bkPh').innerHTML = `<span class="k">PART ${p.n}</span><h2>${esc(p.ar)}</h2>` +
      `<div class="en">${esc(p.en)}</div>`;
    $('bkJump').innerHTML = p.lessons.map((l, n) =>
      `<button type="button" data-l="${n}">${esc(l.ar)}</button>`).join('');
    $('bkLessons').innerHTML = p.lessons.map((l, n) => `
      <section class="bk-lesson" id="L${n}">
        <div class="bk-lh"><h3>${esc(l.ar)}</h3><span class="en">${esc(l.en)}</span></div>
        ${body(l.body)}
      </section>`).join('');

    $('bkPrev').disabled = i === 0;
    $('bkNext').disabled = i === B.parts.length - 1;
    paintMark();

    state.last = i; store.write(state);
  }

  function paintMark() {
    const on = isRead(open);
    $('bkMark').classList.toggle('on', on);
    $('bkMarkT').textContent = on ? 'تمّت قراءته' : 'علّم هذا الجزء مقروءاً';
  }

  /* ── views ────────────────────────────────────── */
  function show(v) {
    view = v;
    $('vBranches').classList.toggle('hidden', v !== 'branches');
    $('vIndex').classList.toggle('hidden', v !== 'index');
    $('vRead').classList.toggle('hidden', v !== 'read');
    const t1 = $('bkT1'), t2 = $('bkT2');
    if (v === 'branches') { t1.textContent = 'الملزمة'; t2.textContent = 'INELT · Study'; }
    else if (v === 'index') { t1.textContent = B.title; t2.textContent = B.author; }
    else { t1.textContent = B.parts[open].ar; t2.textContent = 'PART ' + B.parts[open].n; }
    window.scrollTo({ top: 0, behavior: 'instant' });
    paintProgress();
  }

  /* ── reading progress + active lesson chip ────── */
  function paintProgress() {
    if (view !== 'read') { $('bkProg').style.width = '0'; return; }
    const max = document.documentElement.scrollHeight - innerHeight;
    $('bkProg').style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + '%';

    let cur = 0;
    document.querySelectorAll('.bk-lesson').forEach((el, n) => {
      if (el.getBoundingClientRect().top <= 140) cur = n;
    });
    $('bkJump').querySelectorAll('button').forEach((b, n) => b.classList.toggle('on', n === cur));
  }

  /* ── wiring ───────────────────────────────────── */
  drawCover();
  drawIndex('');
  show('branches');

  $('bkBranchList').addEventListener('click', e => {
    const b = e.target.closest('.bk-branch');
    if (!b || b.disabled) return;
    drawIndex($('bkSearch').value);
    show('index');
  });

  $('bkPartList').addEventListener('click', e => {
    const b = e.target.closest('.bk-part[data-part]');
    if (!b) return;
    drawPart(Number(b.dataset.part));
    show('read');
  });

  $('bkResume').addEventListener('click', () => {
    if (typeof state.last === 'number') { drawPart(state.last); show('read'); }
  });

  $('bkSearch').addEventListener('input', e => drawIndex(e.target.value));

  $('bkJump').addEventListener('click', e => {
    const b = e.target.closest('button[data-l]');
    if (!b) return;
    const el = $('L' + b.dataset.l);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Answers reveal on click; the lessons container is rebuilt per part, so
  // delegate rather than binding each option.
  $('bkLessons').addEventListener('click', e => {
    const opt = e.target.closest('.bk-opt');
    if (!opt) return;
    const q = opt.closest('.bk-q');
    if (q.classList.contains('done')) return;
    q.classList.add('done');
    const right = Number(q.dataset.a);
    q.querySelectorAll('.bk-opt').forEach((el, i) => {
      if (i === right) el.classList.add('right');
      else if (el === opt) el.classList.add('wrong');
    });
  });

  $('bkMark').addEventListener('click', () => {
    state.parts = state.parts || {};
    if (state.parts[open]) delete state.parts[open]; else state.parts[open] = 1;
    store.write(state);
    paintMark(); drawCover(); drawIndex($('bkSearch').value);
  });

  const go = i => { if (i >= 0 && i < B.parts.length) { drawPart(i); show('read'); } };
  $('bkPrev').addEventListener('click', () => go(open - 1));
  $('bkNext').addEventListener('click', () => go(open + 1));
  $('bkTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  $('bkBack').addEventListener('click', () => {
    if (view === 'read') { drawIndex($('bkSearch').value); show('index'); }
    else if (view === 'index') show('branches');
    else window.location.href = '/';
  });

  addEventListener('scroll', paintProgress, { passive: true });
})();

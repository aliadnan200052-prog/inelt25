/* ═══════════════════════════════════════════════════════════════════════
   INELT · الملزمة

   Renders /js/data/booklet.js. Static content only — this page makes no
   network call, creates no attempt and never touches attempts_used.

   Three views on one page: الفروع → قائمة الأجزاء → جزء واحد. Which view
   is open travels in sessionStorage, not in a #hash, so the address stays
   clean (same approach the dashboard tabs use).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  const B = window.BOOKLET;
  const $ = id => document.getElementById(id);

  /* Everything below goes into innerHTML, so escape it. The content ships
     with the app today, but a typo in a future lesson must never be able
     to run as markup. */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const BRANCHES = [
    { k: 'grammar',      ar: 'القواعد',           en: 'Grammar',               ready: true },
    { k: 'reading',      ar: 'القراءة والفهم',    en: 'Reading Comprehension', ready: false },
    { k: 'functions',    ar: 'الوظائف اللغوية',   en: 'Functions',             ready: false },
    { k: 'conversation', ar: 'الحوار',            en: 'Conversation',          ready: false }
  ];

  const CHEV = '<svg class="bk-part-go" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
  const LCHEV = '<svg class="bk-chev" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
  const BULB = '<svg viewBox="0 0 24 24"><path d="M9 18h6"/><path d="M10 22h4"/>' +
    '<path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>';

  let view = 'branches';      // branches | parts | part
  let openPart = 0;

  /* ── view 1: الفروع ────────────────────────────── */
  function drawBranches() {
    $('bkBranchList').innerHTML = BRANCHES.map(b => `
      <button class="bk-branch" data-k="${b.k}" data-go="${b.ready ? b.k : ''}"
              ${b.ready ? '' : 'disabled'}>
        <div class="bk-branch-name">${esc(b.ar)}</div>
        <div class="bk-branch-sub">${esc(b.en)}</div>
        ${b.ready
          ? `<div class="bk-soon" style="color:var(--primary-strong)"><i style="background:var(--primary)"></i> ${B.parts.length} أجزاء · جاهزة</div>`
          : '<div class="bk-soon"><i></i> يُضاف لاحقاً</div>'}
      </button>`).join('');
  }

  /* ── view 2: قائمة الأجزاء ─────────────────────── */
  function drawParts(filter) {
    const q = (filter || '').trim().toLowerCase();
    const hit = p => !q || (p.ar + ' ' + p.en + ' ' +
      p.lessons.map(l => l.ar + ' ' + l.en).join(' ')).toLowerCase().includes(q);
    const list = B.parts.filter(hit);
    $('bkPartList').innerHTML = list.length
      ? list.map(p => `
        <button class="bk-part" data-part="${B.parts.indexOf(p)}">
          <span class="bk-part-n">${p.n}</span>
          <span class="bk-part-t">
            <span class="bk-part-ar">${esc(p.ar)}</span>
            <span class="bk-part-en">${esc(p.en)} · ${p.lessons.length} دروس</span>
          </span>
          ${CHEV}
        </button>`).join('')
      : '<div class="bk-empty">لا توجد نتيجة مطابقة.</div>';
  }

  /* ── view 3: جزء واحد ──────────────────────────── */
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
          <div class="bk-q-t">${esc(b.q)}</div>
          <div class="bk-opts">${b.opts.map((o, i) =>
            `<button class="bk-opt" type="button" data-i="${i}">
               <span class="k">${keys[i] || i + 1}</span><span>${esc(o)}</span>
             </button>`).join('')}</div>
        </div>`;
      }
      default: return '';
    }
  }

  function drawPart(i) {
    const p = B.parts[i];
    openPart = i;
    $('bkPartHead').innerHTML =
      `<div class="n">PART ${p.n}</div><h2>${esc(p.ar)}</h2><div class="en">${esc(p.en)}</div>`;
    $('bkLessons').innerHTML = p.lessons.map((l, n) => `
      <section class="bk-lesson${n === 0 ? ' open' : ''}">
        <button class="bk-lesson-head" type="button">
          <span class="t"><span class="ar">${esc(l.ar)}</span><span class="en">${esc(l.en)}</span></span>
          ${LCHEV}
        </button>
        <div class="bk-body">${l.body.map(block).join('')}</div>
      </section>`).join('');
    $('bkPrev').disabled = i === 0;
    $('bkNext').disabled = i === B.parts.length - 1;
    $('bkTitle').textContent = p.ar;
  }

  /* ── view switching ────────────────────────────── */
  function show(v) {
    view = v;
    $('bkBranches').classList.toggle('hidden', v !== 'branches');
    $('bkParts').classList.toggle('hidden', v !== 'parts');
    $('bkPart').classList.toggle('hidden', v !== 'part');
    $('bkTitle').textContent = v === 'branches' ? 'الملزمة'
      : v === 'parts' ? B.title : B.parts[openPart].ar;
    const back = $('bkBack');
    if (v === 'branches') { back.setAttribute('href', '/'); }
    else { back.removeAttribute('href'); }
    window.scrollTo(0, 0);
  }

  /* ── wiring ────────────────────────────────────── */
  drawBranches();
  drawParts('');
  show('branches');

  $('bkBranchList').addEventListener('click', e => {
    const b = e.target.closest('.bk-branch[data-go]');
    if (!b || !b.dataset.go) return;
    $('bkBy').textContent = B.subtitle + ' — ' + B.author;
    show('parts');
  });

  $('bkPartList').addEventListener('click', e => {
    const b = e.target.closest('.bk-part[data-part]');
    if (!b) return;
    drawPart(Number(b.dataset.part));
    show('part');
  });

  $('bkSearch').addEventListener('input', e => drawParts(e.target.value));

  // Lesson accordions and the answer reveal both live inside #bkLessons,
  // which is rebuilt on every part, so delegate from the container.
  $('bkLessons').addEventListener('click', e => {
    const head = e.target.closest('.bk-lesson-head');
    if (head) { head.parentElement.classList.toggle('open'); return; }

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

  $('bkPrev').addEventListener('click', () => { if (openPart > 0) { drawPart(openPart - 1); show('part'); } });
  $('bkNext').addEventListener('click', () => {
    if (openPart < B.parts.length - 1) { drawPart(openPart + 1); show('part'); }
  });

  // The back button walks the views before it leaves the page.
  $('bkBack').addEventListener('click', e => {
    if (view === 'branches') return;           // let the href take us home
    e.preventDefault();
    show(view === 'part' ? 'parts' : 'branches');
  });
})();

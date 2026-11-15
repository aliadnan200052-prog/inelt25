/* ═══════════════════════════════════════════════════════════════════════
   Vocabulary Size Estimator · UI controller
   Screens: home · intro · test · results · history · method
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var BANK = window.VSE_BANK, E = window.VSE, S = window.VSE_STORE, C = window.VSE_CHARTS;
  var view = document.getElementById('view');
  var DISCLAIMER = 'This is an approximate estimate of your receptive English vocabulary based on a sample of tested words. It is not an exact count or a standardized clinical or educational measurement.';

  var state = { session: null, shownAt: 0, locked: false, lastResult: null };

  /* ── helpers ───────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function pct(p) { return p == null ? '—' : Math.round(p * 100) + '%'; }
  function rangeLabel(b) { return fmt(b.from) + '–' + fmt(b.to); }
  function item(id) { return E.itemById(BANK, id); }
  function exampleHtml(ex) { return esc(ex).replace(/\*([^*]+)\*/g, '<mark>$1</mark>'); }
  function exampleBlank(ex) { return esc(ex).replace(/\*([^*]+)\*/g, '<strong class="target">$1</strong>'); }
  function render(html, focusSel) {
    C.hideTip();
    view.innerHTML = html;
    window.scrollTo(0, 0);
    var f = focusSel && view.querySelector(focusSel);
    if (f) f.focus({ preventScroll: true });
  }
  function on(sel, evt, fn) {
    Array.prototype.forEach.call(view.querySelectorAll(sel), function (n) { n.addEventListener(evt, fn); });
  }

  /* ── theme ─────────────────────────────────────────────────────────── */
  var THEMES = ['auto', 'light', 'dark'];
  function applyTheme(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    var btn = document.getElementById('theme-toggle');
    btn.setAttribute('aria-label', 'Colour theme: ' + (t === 'auto' ? 'automatic' : t) + '. Activate to change.');
    btn.title = 'Theme: ' + t;
  }
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var d = S.update(function (d) { d.prefs.theme = THEMES[(THEMES.indexOf(d.prefs.theme) + 1) % 3]; });
    applyTheme(d.prefs.theme);
  });

  /* ── navigation ────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-nav]');
    if (!t) return;
    e.preventDefault();
    go(t.getAttribute('data-nav'));
  });
  function go(where, arg) {
    if (state.session && where !== 'test' && view.querySelector('.test')) {
      // leaving an unfinished test: it is already saved after every answer
    }
    if (where === 'home') home();
    else if (where === 'history') history();
    else if (where === 'method') method();
    else if (where === 'results') results(arg);
  }

  /* ── HOME ──────────────────────────────────────────────────────────── */
  function home() {
    var d = S.get();
    var last = d.history[d.history.length - 1];
    var resume = d.session && d.session.version === E.SCORING_VERSION ? d.session : null;
    var modes = ['quick', 'standard', 'comprehensive'].map(function (id, i) {
      var m = E.MODES[id];
      var desc = { quick: 'A first estimate. Widest uncertainty range.',
                   standard: 'Recommended. A good balance of time and precision.',
                   comprehensive: 'Most precise. Best for tracking progress over time.' }[id];
      return '<label class="mode">' +
        '<input type="radio" name="mode" value="' + id + '"' + (id === 'standard' ? ' checked' : '') + '>' +
        '<span class="mode-body"><span class="mode-top"><span class="mode-name">' + m.label + '</span>' +
        '<span class="mode-meta">' + m.total + ' questions · ~' + m.minutes + ' min</span></span>' +
        '<span class="mode-desc">' + desc + '</span></span></label>';
    }).join('');
    render(
      '<div class="hero">' +
        '<p class="eyebrow">English vocabulary size</p>' +
        '<h1>How many English words do you know?</h1>' +
        '<p class="lede">This assessment samples words from ten frequency bands, from the 1,000 most common English word families down to rank 20,000, and estimates how many of those families you understand when you read or hear them. You get an estimate with an uncertainty range, not a score out of 100.</p>' +
      '</div>' +
      (resume ? '<div class="card resume"><div><strong>You have an unfinished ' + E.MODES[resume.mode].label.toLowerCase() + ' test</strong>' +
        '<p class="muted">' + resume.responses.length + ' of ' + E.MODES[resume.mode].total + ' answered. Your answers so far are saved.</p></div>' +
        '<div class="row"><button class="btn primary" id="resume">Continue</button><button class="btn ghost" id="discard">Discard</button></div></div>' : '') +
      '<div class="grid-2">' +
        '<form class="card" id="start-form"><h2 class="h3">Choose a test length</h2><div class="modes">' + modes + '</div>' +
        '<button class="btn primary block" type="submit">Begin</button></form>' +
        '<div class="card"><h2 class="h3">What to expect</h2><ul class="ticks">' +
          '<li><strong>Meaning questions.</strong> Pick the definition that fits a word.</li>' +
          '<li><strong>Context questions.</strong> Read a sentence and choose what the word means there.</li>' +
          '<li><strong>Self-report.</strong> Say whether you know a word. Some of these are <em>made-up words</em>, used to correct for over-claiming.</li>' +
          '<li>You will not see whether each answer was right until the end. If you do not know a word, choose <em>I don’t know</em>. Guessing does not raise your estimate, because the scoring corrects for it.</li>' +
        '</ul>' +
        (last ? '<div class="last"><span class="muted">Last result · ' + new Date(last.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</span>' +
          '<div class="last-num">≈ ' + fmt(E.roundEstimate(last.estimate)) + ' <span class="muted">families</span></div>' +
          '<button class="link-btn" data-nav="history">See progress →</button></div>' : '') +
        '</div>' +
      '</div>' +
      '<p class="fine">' + esc(DISCLAIMER) + '</p>'
    );
    view.querySelector('#start-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var mode = view.querySelector('input[name=mode]:checked').value;
      if (resume && !confirm('Starting a new test will discard your unfinished one. Continue?')) return;
      intro(mode);
    });
    if (resume) {
      view.querySelector('#resume').addEventListener('click', function () { state.session = resume; test(); });
      view.querySelector('#discard').addEventListener('click', function () {
        if (!confirm('Discard the unfinished test?')) return;
        S.update(function (d) { d.session = null; }); home();
      });
    }
  }

  /* ── INTRO ─────────────────────────────────────────────────────────── */
  function intro(mode) {
    var m = E.MODES[mode];
    render(
      '<div class="narrow">' +
      '<p class="eyebrow">' + m.label + ' assessment · ' + m.total + ' questions</p>' +
      '<h1 class="h2">Before you start</h1>' +
      '<ol class="steps">' +
        '<li><strong>Answer from your own knowledge.</strong> No dictionaries or translators: the goal is an honest picture, not a high number.</li>' +
        '<li><strong>Use “I don’t know” freely.</strong> A wrong guess is subtracted from your score, so it cannot help on average.</li>' +
        '<li><strong>Choose “I know this word” only if you could explain its meaning.</strong> Some words are invented. Claiming them lowers your estimate.</li>' +
        '<li><strong>There is no time limit and no going back.</strong> Your progress is saved after every answer, so you can leave and resume later.</li>' +
      '</ol>' +
      '<div class="kbd-hint muted">Keyboard: <kbd>1</kbd>–<kbd>4</kbd> choose an answer · <kbd>0</kbd> I don’t know</div>' +
      '<div class="row"><button class="btn primary" id="go">Start the test</button><button class="btn ghost" data-nav="home">Back</button></div>' +
      '</div>', '#go');
    view.querySelector('#go').addEventListener('click', function () {
      var d = S.get();
      state.session = E.createSession(BANK, mode, { recent: d.recent });
      S.update(function (d) { d.session = state.session; });
      test();
    });
  }

  /* ── TEST ──────────────────────────────────────────────────────────── */
  function test() {
    var s = state.session;
    var it = E.nextItem(BANK, s);
    S.update(function (d) { d.session = s; });
    if (!it) return finish();
    var total = E.MODES[s.mode].total;
    var done = s.responses.length;
    var progress = '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '" aria-label="Progress">' +
      '<div class="progress-fill" style="width:' + (100 * done / total).toFixed(1) + '%"></div></div>';
    var head = '<div class="test-head"><span class="muted">Question ' + (done + 1) + ' of ' + total + '</span>' +
      '<button class="link-btn" id="pause">Save &amp; exit</button></div>' + progress;
    var body;
    if (it.kind === 'meaning' || it.kind === 'context') {
      var src = item(it.id);
      var prompt = it.kind === 'meaning'
        ? '<p class="kind">Meaning</p><h1 class="word" lang="en">' + esc(it.w) + '</h1><p class="ask">Choose the meaning that fits best.</p>'
        : '<p class="kind">In context</p><blockquote class="sentence" lang="en">' + exampleBlank(src.ex) + '</blockquote>' +
          '<p class="ask">What does <strong>' + esc(it.w) + '</strong> mean in this sentence?</p>';
      body = prompt + '<div class="options" role="group" aria-label="Answer options">' +
        it.options.map(function (o, i) {
          return '<button class="option" data-a="' + i + '"><span class="key" aria-hidden="true">' + 'ABCD'[i] + '</span><span>' + esc(o.text) + '</span></button>';
        }).join('') +
        '<button class="option idk" data-a="idk"><span class="key" aria-hidden="true">0</span><span>I don’t know this word</span></button></div>';
    } else {
      body = '<p class="kind">Do you know this word?</p><h1 class="word" lang="en">' + esc(it.w) + '</h1>' +
        '<p class="ask">Some words in this section are not real English words.</p>' +
        '<div class="options three" role="group" aria-label="Answer options">' +
        '<button class="option" data-a="know"><span class="key" aria-hidden="true">1</span><span>I know this word and its meaning</span></button>' +
        '<button class="option" data-a="seen"><span class="key" aria-hidden="true">2</span><span>I have seen it, but I’m not sure what it means</span></button>' +
        '<button class="option" data-a="no"><span class="key" aria-hidden="true">3</span><span>I don’t know this word</span></button></div>';
    }
    render('<div class="test">' + head + '<div class="card q">' + body + '</div></div>', '.option');
    state.shownAt = performance.now();
    state.locked = false;
    on('.option', 'click', function () { choose(this.getAttribute('data-a')); });
    view.querySelector('#pause').addEventListener('click', function () { state.session = null; home(); });
  }

  function choose(a) {
    if (state.locked) return;
    state.locked = true;
    var s = state.session, it = s.current;
    var val = (it.kind === 'meaning' || it.kind === 'context') && a !== 'idk' ? +a : a;
    var btn = view.querySelector('.option[data-a="' + a + '"]');
    if (btn) btn.classList.add('chosen');
    E.answer(BANK, s, val, Math.round(performance.now() - state.shownAt));
    S.update(function (d) { d.session = s; });
    setTimeout(test, 160);
  }

  document.addEventListener('keydown', function (e) {
    if (!view.querySelector('.test') || e.metaKey || e.ctrlKey || e.altKey) return;
    var it = state.session && state.session.current;
    if (!it) return;
    var k = e.key.toLowerCase(), a = null;
    if (it.kind === 'meaning' || it.kind === 'context') {
      if ('1234'.indexOf(k) >= 0 && k) a = String(+k - 1);
      else if ('abcd'.indexOf(k) >= 0 && k) a = String('abcd'.indexOf(k));
      else if (k === '0' || k === '?') a = 'idk';
    } else {
      a = { '1': 'know', '2': 'seen', '3': 'no' }[k] || null;
    }
    if (a != null) { e.preventDefault(); choose(a); }
  });

  /* ── FINISH & SCORE ────────────────────────────────────────────────── */
  function finish() {
    var s = state.session;
    var res = E.score(BANK, s.responses, { seed: s.seed });
    var now = Date.now();
    var record = {
      id: 'r' + now, date: now, mode: s.mode, modeLabel: E.MODES[s.mode].label, version: res.version,
      estimate: res.estimate, lo: res.lo, hi: res.hi, se: res.se, falseAlarm: res.falseAlarm, reliable: res.reliable,
      durationMs: now - s.startedAt, seed: s.seed,
      bands: res.bands.map(function (b) { return { id: b.id, p: b.p, lo: b.lo, hi: b.hi, n: b.n }; }),
      responses: s.responses.map(function (r) {
        var o = { k: r.kind, id: r.id, a: r.answer };
        if (r.choice != null) o.c = r.choice;
        if (r.chosenFrom) o.f = r.chosenFrom;
        return o;
      })
    };
    S.update(function (d) {
      d.history.push(record);
      s.responses.forEach(function (r) { d.recent[r.id] = now; });
      d.session = null;
    });
    state.session = null;
    results(record.id);
  }

  function expand(record) {
    // rebuild engine-style responses from the compact saved form
    return record.responses.map(function (r) {
      var it = r.id.charAt(0) === '~' ? null : item(r.id);
      return { kind: r.k, id: r.id, w: it ? it.w : r.id.slice(1), band: it ? it.band : undefined, answer: r.a, chosenFrom: r.f };
    });
  }

  /* ── RESULTS ───────────────────────────────────────────────────────── */
  function results(id) {
    var d = S.get();
    var idx = d.history.findIndex(function (h) { return h.id === id; });
    if (idx < 0) return home();
    var rec = d.history[idx];
    var responses = expand(rec);
    var res = E.score(BANK, responses, { seed: rec.seed });   // deterministic: same numbers as when saved
    var prev = idx > 0 ? d.history[idx - 1] : null;
    var arabic = d.prefs.arabic;
    var bands = res.bands;
    var est = E.roundEstimate(res.estimate);

    // ── analysis
    var tested = bands.filter(function (b) { return b.p != null; });
    var strongest = tested.slice().sort(function (a, b) { return (b.p - a.p) || (b.id - a.id); })[0];
    var weakest = tested.slice().sort(function (a, b) { return (a.p - b.p) || (a.id - b.id); })[0];
    var secure = 0;
    for (var i = 0; i < bands.length; i++) { if (bands[i].p != null && bands[i].p >= 0.8) secure = bands[i].to; else break; }
    var frontier = bands.find(function (b) { return b.p != null && b.p < 0.8; }) || bands[bands.length - 1];

    var warnings = res.warnings.map(function (w) {
      return '<div class="notice ' + w.level + '"><span class="badge">' + { serious: 'Caution', warning: 'Note', info: 'Note' }[w.level] + '</span><span>' + esc(w.text) + '</span></div>';
    }).join('');

    var br = res.breakdown;
    var ctxTotal = responses.filter(function (r) { return r.kind === 'context'; }).length;
    var meanTotal = responses.filter(function (r) { return r.kind === 'meaning'; }).length;
    var chkTotal = responses.filter(function (r) { return r.kind === 'check'; }).length;

    var cmp = '';
    if (prev) {
      var c = E.compare(prev, { estimate: res.estimate, se: res.se, version: res.version, mode: rec.mode });
      var dir = c.diff >= 0 ? 'higher' : 'lower';
      cmp = '<div class="card compare"><h2 class="h3">Compared with your previous result</h2>' +
        '<p><strong>' + (c.diff >= 0 ? '+' : '−') + fmt(Math.abs(c.diff)) + '</strong> families ' + dir + ' than on ' +
        new Date(prev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' (' + prev.modeLabel.toLowerCase() + ' test).</p>' +
        '<p class="muted">' + (!c.sameVersion ? 'The two results used different scoring versions and are not directly comparable.' :
          c.reliable ? 'This difference is larger than the measurement uncertainty of the two tests combined (±' + fmt(1.96 * c.se) + '), so it probably reflects a real change. It does not prove that you learned these words: different tests use different word samples.' :
          'This difference is within the measurement uncertainty of the two tests combined (±' + fmt(1.96 * c.se) + '). Treat the two results as <strong>the same, within error</strong>.') +
        (c.sameMode ? '' : ' The tests had different lengths. Both use the same method, but the shorter one is less precise.') + '</p></div>';
    }

    // ── recommendations
    var plan = recommendations(frontier, res, responses, arabic);

    // ── review table
    var review = responses.map(function (r) {
      if (r.kind === 'pseudo') {
        return '<tr class="pseudo"><td><span class="w">' + esc(r.w) + '</span><span class="tag">made-up word</span></td>' +
          '<td>' + answerLabel(r) + '</td><td class="muted">Not an English word. The right answer was “I don’t know this word”.</td></tr>';
      }
      var it = item(r.id);
      return '<tr><td><span class="w">' + esc(it.w) + '</span><span class="tag">' + esc(it.pos) + ' · ' + rangeLabel(BANK.bands[it.band - 1]) + '</span></td>' +
        '<td>' + answerLabel(r) + '</td><td>' + esc(it.def) +
        (arabic ? ' <span class="ar" lang="ar" dir="rtl">' + esc(it.ar) + '</span>' : '') +
        '<div class="ex muted">' + exampleHtml(it.ex) + '</div></td></tr>';
    }).join('');

    var bandRows = bands.map(function (b) {
      return '<tr><td>' + rangeLabel(b) + '</td><td class="num">' + fmt(b.size) + '</td><td class="num">' + b.n + '</td><td class="num">' + pct(b.p) + '</td><td class="num">' + pct(b.lo) + '–' + pct(b.hi) + '</td><td class="num">' + fmt(b.known || 0) + '</td></tr>';
    }).join('');

    render(
      '<div class="results">' +
      '<section class="card hero-result" aria-labelledby="est-h">' +
        '<p class="eyebrow" id="est-h">Your estimated English vocabulary</p>' +
        '<div class="big-number">' + (res.reliable ? '' : '<span class="approx">~</span>') + fmt(est) + '</div>' +
        '<p class="unit">word families <span class="muted">(receptive, approximate)</span></p>' +
        '<p class="range">Estimated range: <strong>' + fmt(E.roundEstimate(res.lo)) + '–' + fmt(E.roundEstimate(res.hi)) + '</strong> <span class="muted">(95% interval)</span></p>' +
        '<div class="range-bar" aria-hidden="true"><div class="rb-track"></div>' +
          '<div class="rb-ci" style="left:' + (100 * res.lo / res.universe).toFixed(2) + '%;width:' + (100 * (res.hi - res.lo) / res.universe).toFixed(2) + '%"></div>' +
          '<div class="rb-pt" style="left:' + (100 * res.estimate / res.universe).toFixed(2) + '%"></div>' +
          '<span class="rb-l">0</span><span class="rb-r">20,000 families</span></div>' +
        '<p class="disclaimer">' + esc(DISCLAIMER) + '</p>' +
        '<p class="meta muted">' + rec.modeLabel + ' test · ' + responses.length + ' answers · ' + Math.max(1, Math.round(rec.durationMs / 60000)) + ' min · ' +
          new Date(rec.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</p>' +
      '</section>' +
      (warnings ? '<div class="warnings">' + warnings + '</div>' : '') +
      cmp +
      '<section class="card"><div class="card-head"><h2 class="h3">Knowledge by frequency band</h2>' +
        '<button class="link-btn" id="tbl-toggle" aria-expanded="false">Show as table</button></div>' +
        '<p class="muted small">Estimated share of each band you know, after correcting for guessing. The thin lines show each band’s 95% uncertainty range. Bands 7–10 are wider (2,000 or 5,000 families each), so they carry more weight in the total.</p>' +
        '<div id="band-chart" class="chart-wrap"></div>' +
        '<div id="band-table" hidden><div class="table-scroll"><table class="data"><thead><tr><th>Ranks</th><th class="num">Families</th><th class="num">Tested</th><th class="num">Known</th><th class="num">95% range</th><th class="num">≈ Known</th></tr></thead><tbody>' + bandRows + '</tbody></table></div></div>' +
      '</section>' +
      '<section aria-labelledby="kb-h"><h2 class="h3 section-title" id="kb-h">Knowledge breakdown</h2><div class="tiles">' +
        tile(br.meaningCorrect + br.checkKnow, 'Words confidently recognised', 'Meanings chosen correctly (' + br.meaningCorrect + ' of ' + meanTotal + ') plus real words you said you know (' + br.checkKnow + ' of ' + chkTotal + ')') +
        tile(br.contextCorrect + ' / ' + ctxTotal, 'Recognised in context', 'Sentence questions answered correctly') +
        tile(br.seen, 'Encountered, not understood', 'Real words you have seen but could not define') +
        tile('≈ ' + fmt(E.roundEstimate(Math.max(0, res.universe - res.estimate))), 'Estimated unknown families', 'Within the 20,000 families this test covers') +
      '</div></section>' +
      '<section class="card"><h2 class="h3">Performance analysis</h2><dl class="analysis">' +
        (strongest.p - weakest.p < 0.05
          ? row('Strongest / weakest range', 'No band stands out: your estimated knowledge is about ' + pct(strongest.p) + ' in every band.')
          : row('Strongest range', 'Ranks ' + rangeLabel(strongest) + ' · ' + pct(strongest.p) + ' known') +
            row('Weakest range', 'Ranks ' + rangeLabel(weakest) + ' · ' + pct(weakest.p) + ' known')) +
        row('Secure vocabulary', secure ? 'You know at least 80% of every band up to rank ' + fmt(secure) + '.' : 'You know less than 80% of the 1,000 most frequent families. This is the most valuable place to start.') +
        row('Everyday vocabulary', pct(res.everyday) + ' of the 3,000 most frequent families. These cover most of everyday speech and writing.') +
        row('Academic vocabulary', res.academic.p == null ? 'Not enough Academic Word List items in this test (' + res.academic.n + ') to judge.' : pct(res.academic.p) + ' of the Academic Word List items tested (' + res.academic.n + ' items, corrected for guessing).') +
        row('Mid-frequency (3k–6k)', pct(res.mid) + ' known') +
        row('Advanced (6k–20k)', pct(res.advanced) + ' of the 14,000 lower-frequency families, about ' + fmt(E.roundEstimate(res.advanced * 14000)) + ' families') +
        row('Over-claiming check', br.nPseudo ? br.pseudoKnow + ' of ' + br.nPseudo + ' made-up words claimed as known (' + pct(res.falseAlarm) + ')' : 'No made-up words answered') +
      '</dl></section>' +
      plan +
      '<section class="card"><div class="card-head"><h2 class="h3">Review your answers</h2>' +
        '<label class="switch"><input type="checkbox" id="ar-toggle"' + (arabic ? ' checked' : '') + '> Arabic glosses</label></div>' +
        '<details><summary>Show all ' + responses.length + ' words</summary><div class="table-scroll"><table class="data review"><thead><tr><th>Word</th><th>Your answer</th><th>Meaning</th></tr></thead><tbody>' + review + '</tbody></table></div></details>' +
      '</section>' +
      '<div class="row center actions"><button class="btn primary" data-nav="home">Take another test</button><button class="btn ghost" data-nav="history">View progress</button><button class="btn ghost" id="export">Download results (JSON)</button></div>' +
      '</div>', '.big-number');

    C.bandChart(view.querySelector('#band-chart'), bands);
    view.querySelector('#tbl-toggle').addEventListener('click', function () {
      var t = view.querySelector('#band-table'), open = t.hidden;
      t.hidden = !open; this.setAttribute('aria-expanded', String(open));
      this.textContent = open ? 'Hide table' : 'Show as table';
    });
    view.querySelector('#ar-toggle').addEventListener('change', function () {
      var v = this.checked;
      S.update(function (d) { d.prefs.arabic = v; });
      var openDetails = view.querySelector('details') && view.querySelector('details').open;
      results(id);
      if (openDetails) view.querySelector('details').open = true;
    });
    view.querySelector('#export').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify({ result: rec, scored: res, disclaimer: DISCLAIMER }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vocabulary-estimate-' + new Date(rec.date).toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
  }

  function tile(value, label, sub) {
    return '<div class="tile"><div class="tile-v">' + esc(String(value)) + '</div><div class="tile-l">' + esc(label) + '</div><div class="tile-s muted">' + esc(sub) + '</div></div>';
  }
  function row(k, v) { return '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>'; }

  function answerLabel(r) {
    var map = { correct: ['ok', 'Correct'], wrong: ['bad', 'Wrong'], idk: ['neutral', 'Didn’t know'],
                know: ['', 'Said: know it'], seen: ['neutral', 'Said: seen it'], no: ['', 'Said: don’t know'] };
    var m = map[r.answer];
    var cls = m[0];
    if (r.kind === 'pseudo') cls = r.answer === 'no' ? 'ok' : r.answer === 'know' ? 'bad' : 'neutral';
    if (r.kind === 'check') cls = r.answer === 'know' ? 'neutral' : 'neutral';
    var kind = { meaning: 'Meaning', context: 'Context', check: 'Self-report', pseudo: 'Self-report' }[r.kind];
    return '<span class="pill ' + cls + '">' + m[1] + '</span><span class="tag">' + kind + '</span>';
  }

  function recommendations(frontier, res, responses, arabic) {
    var f = frontier.id;
    var steps;
    if (f <= 2) {
      steps = [
        'Concentrate on the 2,000 most frequent word families. They make up roughly 80–90% of the words in ordinary texts, so every family learned here pays off quickly.',
        'Study with spaced-repetition flashcards: 10–20 new words a day, English word on one side, a short definition or Arabic meaning and an example sentence on the other.',
        'Read graded readers written for learners at your level, where almost every word on the page is already familiar to you.',
        'Learn word families together, for example <em>decide · decision · decisive</em>, rather than one form at a time.'
      ];
    } else if (f <= 5) {
      steps = [
        'You are building mid-frequency vocabulary (ranks 2,000–5,000). These words come up regularly but not on every page, so they are best met through a lot of reading.',
        'Read 20–30 minutes a day: graded readers at the upper levels, then young-adult novels and news articles. Note down words that keep coming back.',
        'Study the Academic Word List (570 families) if you study or work in English. It covers about 10% of the words in academic texts.',
        'Learn common prefixes and suffixes (<em>un-, re-, -tion, -ive, -ment</em>), so that one family gives you several words.'
      ];
    } else if (f <= 7) {
      steps = [
        'Your next words are lower-frequency (ranks 5,000–8,000). You meet each one only occasionally, so you need to read a large amount.',
        'Read widely across topics: science, history, fiction and opinion journalism. Specialised topics bring in words you would never meet in general reading.',
        'Keep a personal word log with the sentence where you met each word. Review it weekly with spaced repetition.',
        'Learn Latin and Greek roots (<em>bene-, mal-, -cracy, -logy, spect, port</em>) to work out the meaning of new academic words.'
      ];
    } else {
      steps = [
        'You already know a large vocabulary. Most of your remaining gaps are rare, literary or specialised words.',
        'Read demanding texts: classic and contemporary literature, long-form essays, and specialist writing in your field.',
        'When you meet a new word, look at its etymology and its collocations, not only its definition, so that it stays in memory.',
        'Receptive knowledge is not productive knowledge. To use these words yourself, practise writing and speaking with them.'
      ];
    }
    // words from this test to start with: missed real words in frontier band and the next one
    var missed = responses.filter(function (r) {
      if (r.kind === 'pseudo') return false;
      var it = item(r.id);
      return (it.band === f || it.band === f + 1) && !(r.answer === 'correct' || r.answer === 'know');
    }).slice(0, 8).map(function (r) {
      var it = item(r.id);
      return '<li><span class="w">' + esc(it.w) + '</span> <span class="muted">(' + esc(it.pos) + ')</span> — ' + esc(it.def) +
        (arabic ? ' <span class="ar" lang="ar" dir="rtl">' + esc(it.ar) + '</span>' : '') + '</li>';
    }).join('');
    var overclaim = res.falseAlarm > 0.2 ? '<li>When you are unsure, choose “I’ve seen it” or “I don’t know”. Claiming made-up words lowered the reliability of this result.</li>' : '';
    return '<section class="card plan"><h2 class="h3">Your vocabulary development plan</h2>' +
      '<p>Your learning frontier is <strong>ranks ' + rangeLabel(frontier) + '</strong>, the most frequent band where you know less than 80% of the words (' + pct(frontier.p) + '). Learning words from this band will help your reading most.</p>' +
      '<ol class="steps">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + overclaim + '</ol>' +
      (missed ? '<h3 class="h4">Start with these words from your test</h3><ul class="wordlist">' + missed + '</ul>' : '') +
      '</section>';
  }

  /* ── HISTORY ───────────────────────────────────────────────────────── */
  function history() {
    var d = S.get();
    var h = d.history;
    if (!h.length) {
      render('<div class="narrow"><h1 class="h2">Progress</h1><div class="card empty"><p>You haven’t completed an assessment on this device yet.</p>' +
        '<p class="muted">Results are saved in this browser only. They are not uploaded anywhere.</p><button class="btn primary" data-nav="home">Take the test</button></div></div>');
      return;
    }
    var rows = h.slice().reverse().map(function (r) {
      return '<tr><td>' + new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</td>' +
        '<td>' + esc(r.modeLabel) + (r.reliable ? '' : ' <span class="pill bad">low reliability</span>') + '</td>' +
        '<td class="num"><strong>' + fmt(E.roundEstimate(r.estimate)) + '</strong></td>' +
        '<td class="num">' + fmt(E.roundEstimate(r.lo)) + '–' + fmt(E.roundEstimate(r.hi)) + '</td>' +
        '<td class="actions-cell"><button class="link-btn" data-open="' + r.id + '">Open</button> <button class="link-btn danger" data-del="' + r.id + '">Delete</button></td></tr>';
    }).join('');
    var trend = '';
    if (h.length >= 2) {
      var c = E.compare(h[0], h[h.length - 1]);
      trend = '<p>From your first to your latest result the estimate changed by <strong>' + (c.diff >= 0 ? '+' : '−') + fmt(Math.abs(c.diff)) + '</strong> families. ' +
        (c.reliable ? 'That is larger than the combined measurement uncertainty (±' + fmt(1.96 * c.se) + '), so it probably reflects real growth or decline.' :
          'That is within the combined measurement uncertainty (±' + fmt(1.96 * c.se) + '), so the results cannot be told apart.') + '</p>';
    }
    render('<div class="history"><h1 class="h2">Progress</h1>' +
      '<section class="card"><h2 class="h3">Estimated vocabulary over time</h2>' +
      '<p class="muted small">Dots are estimates and vertical lines are 95% ranges. Treat two results as different only when their ranges clearly separate. Every test uses the same method, scoring and frequency bands, and each draws a new sample of words, so results can move a little even when your vocabulary has not changed.</p>' +
      '<div id="prog-chart" class="chart-wrap"></div>' + trend + '</section>' +
      '<section class="card"><h2 class="h3">Saved results</h2><div class="table-scroll"><table class="data"><thead><tr><th>Date</th><th>Test</th><th class="num">Estimate</th><th class="num">95% range</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="row"><button class="btn ghost danger" id="clear">Delete all results</button></div></section></div>');
    C.progressChart(view.querySelector('#prog-chart'), h);
    on('[data-open]', 'click', function () { results(this.getAttribute('data-open')); });
    on('[data-del]', 'click', function () {
      var id = this.getAttribute('data-del');
      if (!confirm('Delete this result?')) return;
      S.update(function (d) { d.history = d.history.filter(function (r) { return r.id !== id; }); });
      history();
    });
    view.querySelector('#clear').addEventListener('click', function () {
      if (!confirm('Delete all saved results and test history from this device?')) return;
      S.update(function (d) { d.history = []; d.recent = {}; });
      history();
    });
  }

  /* ── METHOD ────────────────────────────────────────────────────────── */
  function method() {
    var counts = BANK.bands.map(function (b) { return BANK.items.filter(function (i) { return i.band === b.id; }).length; });
    var bandRows = BANK.bands.map(function (b, i) {
      return '<tr><td>' + b.id + '</td><td>' + rangeLabel(b) + '</td><td class="num">' + fmt(b.size) + '</td><td class="num">' + counts[i] + '</td></tr>';
    }).join('');
    var awlN = BANK.items.filter(function (i) { return i.awl; }).length;
    render('<article class="prose">' +
      '<p class="eyebrow">Method &amp; limitations</p><h1 class="h2">How the estimate is made</h1>' +
      '<p class="lede">' + esc(DISCLAIMER) + '</p>' +
      '<h2 class="h3">What is measured</h2>' +
      '<p><strong>Receptive</strong> knowledge of written word meanings: whether you recognise what a word means when you see it. The test cannot tell how many words you can <em>use</em> in speech or writing (productive vocabulary). That is usually smaller.</p>' +
      '<p>The unit is the <strong>word family</strong>: a headword with its inflections and its most transparent derivatives. <em>develop, develops, developed, developing, development</em> count as one family, never five. Families are approximated automatically (see below), so the counts are not identical to published family lists.</p>' +
      '<h2 class="h3">Frequency bands and word list</h2>' +
      '<p>The ranking was built for this tool from the <a href="https://github.com/rspeer/wordfreq" rel="noopener">wordfreq</a> data (v3.1), which combines several large English corpora (subtitles, Wikipedia, news, books, web text). The steps:</p>' +
      '<ol><li>Take the 150,000 most frequent word forms.</li><li>Keep forms that the <em>lemminflect</em> lexicon recognises. This removes most names, abbreviations and internet tokens. Function words are kept.</li>' +
      '<li>Merge inflections into their lemma.</li><li>Merge transparent derivations (<em>-ly, -ness, -ity, -ment, -ion, -er/-or, -able, -ful, -less, un-, non-</em>, and a few prefixes under strict conditions) into their base.</li><li>Rank the resulting families by total frequency.</li></ol>' +
      '<p>This is <strong>not</strong> the BNC/COCA family list (Nation), the NGSL or COCA rankings, and it does not claim to be. It is an independent, reproducible approximation that follows the same principles. The scripts are in <code>tools/vocab/</code>. Different corpora rank words differently, especially below rank 10,000.</p>' +
      '<div class="table-scroll"><table class="data"><thead><tr><th>Band</th><th>Ranks</th><th class="num">Families in band</th><th class="num">Test words</th></tr></thead><tbody>' + bandRows +
      '<tr><td></td><td><strong>Total</strong></td><td class="num"><strong>20,000</strong></td><td class="num"><strong>' + BANK.items.length + '</strong></td></tr></tbody></table></div>' +
      '<p>Test words were drawn <strong>at random</strong> from each band, then screened by hand. The screening removed proper nouns, slang, offensive words, function words and words with several unrelated meanings. Each word has a definition, an example sentence and an Arabic gloss written for this tool. ' + awlN + ' words are marked as Academic Word List (Coxhead, 2000) headwords or family members. There are ' + BANK.pseudowords.length + ' made-up words. Each was checked automatically: it has zero frequency in the corpus data, it is not in the lexicon, and it is not one letter away from a common word.</p>' +
      '<h2 class="h3">Question types</h2>' +
      '<ul><li><strong>Meaning recognition</strong>: four definitions. The wrong options are real definitions of other words with the same part of speech from the same band, so they are equally plausible.</li>' +
      '<li><strong>Meaning in context</strong>: the same format, with the word shown in a sentence.</li>' +
      '<li><strong>Self-report</strong>: know / seen but unsure / don’t know, mixed with made-up words.</li></ul>' +
      '<h2 class="h3">Sampling and adaptivity</h2>' +
      '<p>The test is <strong>stratified</strong>. Every band receives a minimum number of words (3, 5 or 8, depending on test length), presented in rounds from frequent to rare. After that, each further word goes to the band where it reduces the uncertainty of the total estimate most (Neyman-type allocation, <code>N²·p(1−p)</code>). One or two answers never steer the test: the knowledge rate used for allocation is predicted from the <em>neighbouring</em> bands, with a prior pulling it towards 50%. A band’s own answers never decide how many words it gets. Without this rule, simulation showed underestimates of several hundred families. Bands that look already mastered or out of reach are capped, so you are not flooded with trivial or impossible words.</p>' +
      '<h2 class="h3">Scoring</h2>' +
      '<ul><li>Multiple choice is corrected for guessing: <code>known = (right − wrong/3) / items</code>. “I don’t know” scores 0 and is not penalised.</li>' +
      '<li>Self-report is corrected with the false-alarm rate <em>f</em> on made-up words: <code>(hit rate − f) / (1 − f)</code>. Self-report counts half as much as multiple choice.</li>' +
      '<li>Band estimates are smoothed so that knowledge does not rise as words get rarer (weighted isotonic regression). This is the model’s one structural assumption.</li>' +
      '<li><strong>Estimate = Σ (families in band × estimated proportion known)</strong>. No arbitrary multipliers are used.</li>' +
      '<li>Uncertainty comes from a stratified bootstrap (2,000 resamples of your own answers within each band, with the whole scoring procedure repeated each time). The 2.5th and 97.5th percentiles give the 95% range.</li></ul>' +
      '<h2 class="h3">How well it works: simulation, not validation</h2>' +
      '<p>The scoring was checked on simulated test-takers whose true vocabulary is known (script: <code>tools/vocab/test_engine.js</code>). Across simulated learners with about 2,000 to 15,000 families, honest and guessing alike, the average error was within a few hundred families. The typical error of a single test was about 900–1,600 families for the quick test, 600–1,100 for the standard test and 550–950 for the comprehensive test. The 95% ranges contained the true value in roughly 85–95% of runs. Real people are not simulations. <strong>This test has not been validated against an established vocabulary test with real learners.</strong></p>' +
      '<h2 class="h3">Limitations</h2>' +
      '<ul><li>The bank has about 40–50 words per band. That is enough for an estimate, not for fine distinctions within a band. Repeating the test will eventually reuse words. Words you saw in the last 60 days are avoided when possible.</li>' +
      '<li>Knowledge beyond rank 20,000 is not measured. Very advanced users get a lower bound.</li>' +
      '<li>Family grouping is automatic and imperfect. Some words are joined or split differently from published lists.</li>' +
      '<li>Recognising a definition is not the same as fully knowing a word: its other meanings, collocations, spelling and use.</li>' +
      '<li>Vocabulary size is not a proficiency level, and this tool does not map results to CEFR levels.</li>' +
      '<li>Results from different scoring versions are flagged as not comparable.</li></ul>' +
      '<h2 class="h3">Related research</h2>' +
      '<p class="small">Nation &amp; Beglar (2007) Vocabulary Size Test · Meara &amp; Buxton (1987), Huibregts et al. (2002) on yes/no tests and pseudowords · Coxhead (2000) Academic Word List · Browne, Culligan &amp; Phillips, New General Service List · Speer et al., wordfreq. This tool is independent of all of these and is not endorsed by their authors.</p>' +
      '<div class="row"><button class="btn primary" data-nav="home">Back to the test</button></div>' +
      '</article>');
  }

  /* ── boot ──────────────────────────────────────────────────────────── */
  var d0 = S.get();
  applyTheme(d0.prefs.theme);
  if (!S.available()) {
    view.insertAdjacentHTML('beforebegin', '<p class="notice warning">Your browser is blocking local storage, so results will not be saved after you close this page.</p>');
  }
  home();
})();

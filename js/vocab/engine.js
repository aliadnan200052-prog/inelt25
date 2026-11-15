/* ═══════════════════════════════════════════════════════════════════════
   Vocabulary Size Estimator · engine
   Pure logic: test assembly, adaptive band allocation, scoring, bootstrap.
   No DOM access, so it runs unchanged in Node for the verification tests
   (tools/vocab/test_engine.js).

   Scoring version is stored with every saved result. Results computed with
   different versions are never presented as directly comparable.
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var SCORING_VERSION = 1;

  /* Test forms. Each form uses exactly the same algorithm; only length
     differs. `minPerBand` items are given in every band before any adaptive
     allocation, so every band is always sampled (stratification). */
  var MODES = {
    quick:         { id: 'quick',         label: 'Quick',         total: 50,  pseudo: 8,  minPerBand: 3, minutes: 6,  context: 0.20, check: 0.20 },
    standard:      { id: 'standard',      label: 'Standard',      total: 100, pseudo: 16, minPerBand: 5, minutes: 12, context: 0.20, check: 0.20 },
    comprehensive: { id: 'comprehensive', label: 'Comprehensive', total: 180, pseudo: 28, minPerBand: 8, minutes: 22, context: 0.20, check: 0.20 }
  };

  var MCQ_OPTIONS = 4;          // options per multiple-choice item
  var CHECK_WEIGHT = 0.5;       // self-report items count half as much as MCQ items
  var FLOOR_CAP_FACTOR = 2;     // bands at floor/ceiling get at most 2 × minPerBand items
  var BOOTSTRAP_REPS = 2000;
  var FALLBACK = {
    adverb: ['in a careful and patient way', 'very loudly and angrily', 'at exactly the same time',
             'in a friendly and warm manner', 'for a very short time only', 'with great sadness']
  };

  /* ── Random numbers (seedable so a test can be reproduced) ─────────── */
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {           // mulberry32
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rand) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ── Session creation ──────────────────────────────────────────────── */
  function createSession(bank, modeId, opts) {
    opts = opts || {};
    var mode = MODES[modeId];
    if (!mode) throw new Error('Unknown mode ' + modeId);
    var seed = opts.seed != null ? opts.seed : Math.floor(Math.random() * 2147483647);
    var real = mode.total - mode.pseudo;
    var nCheck = Math.round(real * mode.check);
    var nContext = Math.round(real * mode.context);
    return {
      version: SCORING_VERSION,
      mode: modeId,
      seed: seed,
      draws: 0,                      // how many random numbers consumed (for resume)
      startedAt: opts.now || Date.now(),
      recent: opts.recent || {},     // wordId -> timestamp last tested (avoid repeats)
      quota: { meaning: real - nCheck - nContext, context: nContext, check: nCheck, pseudo: mode.pseudo },
      used: {},                      // ids already used in this session
      responses: [],                 // answered items
      current: null                  // item on screen
    };
  }

  function sessionRand(session) {
    // Re-create the stream and skip the numbers already used, so a session
    // restored from localStorage continues deterministically.
    var r = rng(session.seed);
    for (var i = 0; i < session.draws; i++) r();
    return function () { session.draws++; return r(); };
  }

  /* ── Per-band tallies used by both allocation and scoring ──────────── */
  function tally(bank, responses) {
    var bands = bank.bands.map(function (b) {
      return { id: b.id, size: b.size, mcq: [], check: [], n: 0 };
    });
    var pseudo = [];
    responses.forEach(function (r) {
      if (r.kind === 'pseudo') { pseudo.push(r.answer); return; }
      var b = bands[r.band - 1];
      b.n++;
      if (r.kind === 'check') b.check.push(r.answer);
      else b.mcq.push(r.answer);            // 'correct' | 'wrong' | 'idk'
    });
    return { bands: bands, pseudo: pseudo };
  }

  /* Proportion known in one band, corrected for guessing.
     MCQ:   classic correction  known = R − W/(k−1)        (k = 4 options)
     Check: hit-rate correction (h − f)/(1 − f), f = pseudoword false-alarm rate
     Combined: weighted mean, self-report items weighted CHECK_WEIGHT.
     With `unclipped` the corrected value may fall slightly below 0: clipping
     every band at 0 before summing would bias the total upward for learners
     who know almost none of the rare (5,000-family) bands, so the total is
     computed from unclipped values and only the displayed values are clipped. */
  function bandProportion(mcq, check, falseAlarm, unclipped) {
    var lo = unclipped ? -1 : 0;
    var wM = 0, wC = 0, pM = 0, pC = 0;
    if (mcq.length) {
      var R = 0, W = 0;
      for (var i = 0; i < mcq.length; i++) {
        if (mcq[i] === 'correct') R++; else if (mcq[i] === 'wrong') W++;
      }
      pM = Math.max(lo, Math.min(1, (R - W / (MCQ_OPTIONS - 1)) / mcq.length));
      wM = mcq.length;
    }
    if (check.length) {
      var K = 0;
      for (var j = 0; j < check.length; j++) if (check[j] === 'know') K++;
      var h = K / check.length;
      var f = Math.min(falseAlarm, 0.95);
      pC = Math.max(lo, Math.min(1, (h - f) / (1 - f)));
      wC = check.length * CHECK_WEIGHT;
    }
    if (wM + wC === 0) return null;
    return (pM * wM + pC * wC) / (wM + wC);
  }

  function falseAlarmRate(pseudo) {
    if (!pseudo.length) return 0;
    var fa = 0;
    for (var i = 0; i < pseudo.length; i++) if (pseudo[i] === 'know') fa++;
    return fa / pseudo.length;
  }

  /* Weighted isotonic regression (pool-adjacent-violators): forces the
     proportion known to be non-increasing from frequent to rare bands.
     This is the one structural assumption of the model. */
  function isotonicDecreasing(values, weights) {
    var blocks = [];
    for (var i = 0; i < values.length; i++) {
      if (values[i] == null) continue;
      blocks.push({ v: values[i], w: Math.max(weights[i], 1e-9), idx: [i] });
      while (blocks.length > 1 && blocks[blocks.length - 2].v < blocks[blocks.length - 1].v) {
        var b = blocks.pop(), a = blocks.pop();
        var w = a.w + b.w;
        blocks.push({ v: (a.v * a.w + b.v * b.w) / w, w: w, idx: a.idx.concat(b.idx) });
      }
    }
    var out = values.slice();
    blocks.forEach(function (bl) { bl.idx.forEach(function (k) { out[k] = bl.v; }); });
    return out;
  }

  function estimateFrom(t) {
    var f = falseAlarmRate(t.pseudo);
    var raw = t.bands.map(function (b) { return bandProportion(b.mcq, b.check, f, true); });
    var w = t.bands.map(function (b) { return b.mcq.length + b.check.length * CHECK_WEIGHT; });
    var smoothU = isotonicDecreasing(raw, w);
    var total = 0;
    t.bands.forEach(function (b, i) { total += b.size * (smoothU[i] == null ? 0 : smoothU[i]); });
    function clip(v) { return v == null ? null : Math.max(0, Math.min(1, v)); }
    return { total: Math.max(0, total), totalU: total, raw: raw.map(clip), smooth: smoothU.map(clip), smoothU: smoothU, falseAlarm: f };
  }

  /* ── Adaptive allocation ───────────────────────────────────────────── */
  /* After a stratified baseline (every band gets `minPerBand` items, round-
     robin from frequent to rare), each further item goes to the band where
     it most reduces the variance of the total estimate (Neyman-style):
         gain_b = N_b² · p_b(1−p_b) · (1/n_b − 1/(n_b+1))
     Crucially, p_b here is PREDICTED FROM THE NEIGHBOURING BANDS ONLY
     (leave-one-band-out), never from band b's own answers. If a band's own
     lucky or unlucky start decided how many more items it received, its
     estimate would be biased (optional-stopping bias) — simulation showed
     underestimates of several hundred words before this rule was added.
     Predictions are shrunk towards 0.5 (Jeffreys prior), so one or two
     answers never drive the allocation. Bands predicted to be at floor or
     ceiling (< .10 or > .90) are capped at 2 × minPerBand items so a learner
     is not flooded with impossible or trivial words. */
  function chooseBand(bank, session, rand) {
    var mode = MODES[session.mode];
    var t = tally(bank, session.responses);
    var avail = bank.bands.map(function (b) {
      return bank.items.filter(function (it) { return it.band === b.id && !session.used[it.id]; }).length;
    });
    var counts = t.bands.map(function (b) { return b.n; });
    // Phase 1: round-robin until every band has minPerBand items.
    var minN = Infinity, minIdx = -1;
    for (var i = 0; i < counts.length; i++) {
      if (avail[i] > 0 && counts[i] < mode.minPerBand && counts[i] < minN) { minN = counts[i]; minIdx = i; }
    }
    if (minIdx >= 0) return minIdx + 1;
    // Phase 2: variance-reduction allocation using neighbour predictions.
    var f = falseAlarmRate(t.pseudo);
    var shrunk = t.bands.map(function (b) {
      var p = bandProportion(b.mcq, b.check, f);
      var wN = b.mcq.length + b.check.length * CHECK_WEIGHT;
      return ((p == null ? 0.5 : p) * wN + 0.5) / (wN + 1);
    });
    var best = -1, bestGain = -1;
    t.bands.forEach(function (b, i) {
      if (!avail[i]) return;
      var nb = [];
      if (i > 0) nb.push(shrunk[i - 1]);
      if (i < shrunk.length - 1) nb.push(shrunk[i + 1]);
      var ps = nb.reduce(function (a, c) { return a + c; }, 0) / nb.length;
      var n = b.n;
      if ((ps < 0.10 || ps > 0.90) && n >= mode.minPerBand * FLOOR_CAP_FACTOR) return;
      var gain = b.size * b.size * ps * (1 - ps) * (1 / Math.max(n, 1) - 1 / (n + 1));
      gain *= 1 + 0.01 * rand();                                         // break ties randomly
      if (gain > bestGain) { bestGain = gain; best = i; }
    });
    if (best < 0) {                       // every band capped: take the least-tested band with items left
      var least = Infinity;
      for (var k = 0; k < avail.length; k++) if (avail[k] && counts[k] < least) { least = counts[k]; best = k; }
    }
    return best < 0 ? null : best + 1;
  }

  function pickFrom(list, session, rand) {
    // Prefer words never tested before; then words tested longest ago.
    var fresh = list.filter(function (it) { return !session.recent[it.id]; });
    if (fresh.length) return fresh[Math.floor(rand() * fresh.length)];
    var sorted = list.slice().sort(function (a, b) { return (session.recent[a.id] || 0) - (session.recent[b.id] || 0); });
    var head = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 4)));
    return head[Math.floor(rand() * head.length)];
  }

  function buildOptions(bank, item, rand) {
    // Distractors: definitions of other words with the same part of speech,
    // drawn from the same band first, then neighbouring bands. Using real
    // definitions of equal difficulty keeps distractors plausible.
    var others = [];
    for (var d = 0; d <= 9 && others.length < 3; d++) {
      var pool = bank.items.filter(function (it) {
        return it.id !== item.id && it.pos === item.pos && Math.abs(it.band - item.band) === d &&
          others.indexOf(it) < 0 && it.def !== item.def;
      });
      pool = shuffle(pool, rand);
      while (pool.length && others.length < 3) others.push(pool.shift());
    }
    // Too few same-POS words (only adverbs, in practice): top up with
    // hand-written definitions of the same grammatical shape.
    var fill = shuffle(FALLBACK[item.pos] || [], rand).filter(function (d) { return d !== item.def; });
    while (others.length < 3 && fill.length) others.push({ def: fill.shift(), id: null });
    var opts = [{ text: item.def, correct: true }].concat(others.map(function (o) {
      return { text: o.def, correct: false, from: o.id };
    }));
    return shuffle(opts, rand);
  }

  function remainingTotal(session) {
    var q = session.quota;
    return q.meaning + q.context + q.check + q.pseudo;
  }

  /* Draw the next item, or return null if the test is complete. */
  function nextItem(bank, session) {
    if (session.current) return session.current;
    var rand = sessionRand(session);
    var q = session.quota;
    var left = remainingTotal(session);
    if (left <= 0) return null;
    // Spread pseudowords evenly-at-random; never in the first 4 screens.
    var answered = session.responses.length;
    var pseudoTurn = answered >= 4 && q.pseudo > 0 && rand() < q.pseudo / left;
    var pseudoPool = bank.pseudowords.filter(function (w) { return !session.used['~' + w]; })
      .map(function (w) { return { id: '~' + w, w: w }; });
    if ((pseudoTurn || (q.pseudo > 0 && q.pseudo >= left)) && pseudoPool.length) {
      var pw = pickFrom(pseudoPool, session, rand);
      q.pseudo--;
      session.used[pw.id] = 1;
      session.current = { kind: 'pseudo', id: pw.id, w: pw.w, n: answered + 1 };
      return session.current;
    }
    if (q.meaning + q.context + q.check <= 0) { q.pseudo = 0; return null; }
    var band = chooseBand(bank, session, rand);
    if (band == null) { q.meaning = q.context = q.check = 0; return nextItem(bank, session); }
    var pool = bank.items.filter(function (it) { return it.band === band && !session.used[it.id]; });
    var item = pickFrom(pool, session, rand);
    session.used[item.id] = 1;
    // Item format chosen in proportion to the remaining quota of each format.
    var r = rand() * (q.meaning + q.context + q.check), kind;
    if (r < q.meaning) kind = 'meaning'; else if (r < q.meaning + q.context) kind = 'context'; else kind = 'check';
    q[kind]--;
    session.current = { kind: kind, id: item.id, w: item.w, band: band, n: answered + 1 };
    if (kind !== 'check') session.current.options = buildOptions(bank, item, rand);
    return session.current;
  }

  /* answer: for MCQ an option index or 'idk'; for check/pseudo 'know' | 'seen' | 'no' */
  function answer(bank, session, value, ms) {
    var cur = session.current;
    if (!cur) throw new Error('No item on screen');
    var rec = { kind: cur.kind, id: cur.id, w: cur.w, band: cur.band, ms: ms || 0 };
    if (cur.kind === 'meaning' || cur.kind === 'context') {
      if (value === 'idk') rec.answer = 'idk';
      else {
        rec.choice = value;
        rec.answer = cur.options[value] && cur.options[value].correct ? 'correct' : 'wrong';
        if (rec.answer === 'wrong') rec.chosenFrom = cur.options[value].from;
      }
    } else {
      if (['know', 'seen', 'no'].indexOf(value) < 0) throw new Error('bad answer');
      rec.answer = value;
    }
    session.responses.push(rec);
    session.current = null;
    return rec;
  }

  /* ── Scoring ───────────────────────────────────────────────────────── */
  function percentile(sorted, p) {
    var idx = (sorted.length - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  }

  function resample(arr, rand) {
    var out = new Array(arr.length);
    for (var i = 0; i < arr.length; i++) out[i] = arr[Math.floor(rand() * arr.length)];
    return out;
  }

  /* Full result. Uncertainty: smoothed, stratified bootstrap.
     - MCQ and self-report answers are resampled within each band, pseudoword
       answers as one pool, and the whole estimator (guessing correction,
       false-alarm correction, isotonic smoothing) is recomputed each time.
     - Smoothing: before resampling, each band's MCQ and self-report pools get
       one "known" and one "not known" pseudo-observation (and the pseudoword
       pool one of each). Without this, a band answered 5/5 correctly would
       show zero uncertainty, which is never true of a 5-word sample.
     - Because smoothing shifts the bootstrap distribution towards 50%, the
       interval is built from bootstrap DEVIATIONS around their own mean,
       re-centred on the point estimate: [est + q2.5(d), est + q97.5(d)].   */
  function augment(arr, yes, no) { return arr.length ? arr.concat([yes, no]) : arr; }
  function deviationInterval(point, samples, lo, hi) {
    if (!samples.length || point == null) return [null, null];
    var m = 0; samples.forEach(function (x) { m += x; }); m /= samples.length;
    var d = samples.map(function (x) { return x - m; }).sort(function (a, b) { return a - b; });
    return [Math.max(lo, point + percentile(d, 0.025)), Math.min(hi, point + percentile(d, 0.975))];
  }
  function score(bank, responses, opts) {
    opts = opts || {};
    var t = tally(bank, responses);
    var est = estimateFrom(t);
    var rand = rng(opts.seed || 12345);
    var reps = opts.reps || BOOTSTRAP_REPS;
    var universe = bank.bands.reduce(function (s, b) { return s + b.size; }, 0);
    var aug = {
      pseudo: augment(t.pseudo, 'know', 'no'),
      bands: t.bands.map(function (b) { return { size: b.size, mcq: augment(b.mcq, 'correct', 'idk'), check: augment(b.check, 'know', 'no') }; })
    };
    var totals = [], perBand = t.bands.map(function () { return []; });
    for (var r = 0; r < reps; r++) {
      var tb = {
        pseudo: resample(aug.pseudo, rand),
        bands: aug.bands.map(function (b) { return { size: b.size, mcq: resample(b.mcq, rand), check: resample(b.check, rand) }; })
      };
      var e = estimateFrom(tb);
      totals.push(e.totalU);
      e.smoothU.forEach(function (v, i) { if (v != null) perBand[i].push(v); });
    }
    var ci = deviationInterval(est.totalU, totals, 0, universe);
    var lo = ci[0], hi = ci[1];

    var bands = t.bands.map(function (b, i) {
      var bci = deviationInterval(est.smooth[i], perBand[i], 0, 1);
      var c = { correct: 0, wrong: 0, idk: 0, know: 0, seen: 0, no: 0 };
      b.mcq.forEach(function (a) { c[a]++; });
      b.check.forEach(function (a) { c[a]++; });
      return {
        id: b.id, size: b.size, from: bank.bands[i].from, to: bank.bands[i].to,
        nMcq: b.mcq.length, nCheck: b.check.length, n: b.n, counts: c,
        raw: est.raw[i], p: est.smooth[i],
        lo: bci[0], hi: bci[1],
        known: est.smooth[i] == null ? null : b.size * est.smooth[i]
      };
    });

    // Breakdown of responses (item counts, not extrapolations)
    var br = { meaningCorrect: 0, contextCorrect: 0, checkKnow: 0, seen: 0, notKnown: 0, wrong: 0,
               pseudoKnow: 0, pseudoSeen: 0, pseudoNo: 0, nPseudo: t.pseudo.length, nReal: 0 };
    responses.forEach(function (r) {
      if (r.kind === 'pseudo') {
        if (r.answer === 'know') br.pseudoKnow++; else if (r.answer === 'seen') br.pseudoSeen++; else br.pseudoNo++;
        return;
      }
      br.nReal++;
      if (r.kind === 'meaning' && r.answer === 'correct') br.meaningCorrect++;
      else if (r.kind === 'context' && r.answer === 'correct') br.contextCorrect++;
      else if (r.kind === 'check' && r.answer === 'know') br.checkKnow++;
      else if (r.kind === 'check' && r.answer === 'seen') br.seen++;
      else if (r.answer === 'wrong') br.wrong++;
      else br.notKnown++;
    });

    var warnings = [];
    var thin = bands.filter(function (b) { return b.n < 2; }).length;
    var reliable = true;
    if (br.nReal < 30 || thin > 0) {
      reliable = false;
      warnings.push({ level: 'serious', text: 'Not enough answers for a reliable estimate' + (thin ? ' (' + thin + ' frequency band' + (thin > 1 ? 's were' : ' was') + ' barely tested)' : '') + '. Treat the number as a rough indication only, or take a full test.' });
    }
    if (t.pseudo.length < 5) {
      warnings.push({ level: 'warning', text: 'Too few fake words were answered to check for over-claiming reliably.' });
    }
    if (est.falseAlarm > 0.5) {
      reliable = false;
      warnings.push({ level: 'serious', text: 'You said you knew ' + Math.round(est.falseAlarm * 100) + '% of the fake words. The estimate has been corrected for this, but it is unreliable. Retake the test and only choose “I know this word” when you can explain its meaning.' });
    } else if (est.falseAlarm > 0.2) {
      warnings.push({ level: 'warning', text: 'You claimed to know ' + Math.round(est.falseAlarm * 100) + '% of the fake words. Your self-report answers were corrected downward to compensate.' });
    }
    var topBand = bands[bands.length - 1];
    if (topBand.p != null && topBand.p > 0.8) {
      warnings.push({ level: 'info', text: 'You know most of the rarest words tested. Your real vocabulary probably extends beyond the 20,000 families this test can measure, so the estimate is a lower bound.' });
    }

    function covered(ids) {
      var s = 0, n = 0;
      bands.forEach(function (b) { if (ids.indexOf(b.id) >= 0 && b.p != null) { s += b.known; n += b.size; } });
      return n ? s / n : null;
    }
    // Academic vocabulary: MCQ answers on AWL-listed items, guessing-corrected
    var awl = { R: 0, W: 0, n: 0 };
    responses.forEach(function (r) {
      if (r.kind !== 'meaning' && r.kind !== 'context') return;
      var it = itemById(bank, r.id);
      if (!it || !it.awl) return;
      awl.n++; if (r.answer === 'correct') awl.R++; else if (r.answer === 'wrong') awl.W++;
    });

    return {
      version: SCORING_VERSION,
      estimate: est.total, lo: lo, hi: hi, se: sd(totals),
      falseAlarm: est.falseAlarm, universe: universe,
      bands: bands, breakdown: br, reliable: reliable, warnings: warnings,
      everyday: covered([1, 2, 3]), mid: covered([4, 5, 6]), advanced: covered([7, 8, 9, 10]),
      academic: awl.n >= 4 ? { p: Math.max(0, (awl.R - awl.W / (MCQ_OPTIONS - 1)) / awl.n), n: awl.n } : { p: null, n: awl.n }
    };
  }

  function sd(a) {
    var m = 0; a.forEach(function (x) { m += x; }); m /= a.length;
    var v = 0; a.forEach(function (x) { v += (x - m) * (x - m); });
    return Math.sqrt(v / (a.length - 1));
  }

  var _byId = null, _bankRef = null;
  function itemById(bank, id) {
    if (_bankRef !== bank) {
      _byId = {}; _bankRef = bank;
      bank.items.forEach(function (it) { _byId[it.id] = it; });
    }
    return _byId[id];
  }

  /* Reported number: rounded so it never looks more precise than it is. */
  function roundEstimate(x) {
    if (x < 1000) return Math.round(x / 10) * 10;
    if (x < 5000) return Math.round(x / 50) * 50;
    return Math.round(x / 100) * 100;
  }

  /* Comparing two saved results. A change is called "reliable" only when it
     exceeds 1.96 × the combined standard error of the two estimates and both
     used the same scoring version. */
  function compare(a, b) {
    var diff = b.estimate - a.estimate;
    var se = Math.sqrt(a.se * a.se + b.se * b.se);
    return {
      diff: diff, se: se,
      sameVersion: a.version === b.version,
      sameMode: a.mode === b.mode,
      reliable: a.version === b.version && Math.abs(diff) > 1.96 * se
    };
  }

  var api = {
    MODES: MODES, SCORING_VERSION: SCORING_VERSION, MCQ_OPTIONS: MCQ_OPTIONS, CHECK_WEIGHT: CHECK_WEIGHT,
    rng: rng, createSession: createSession, nextItem: nextItem, answer: answer, score: score,
    tally: tally, bandProportion: bandProportion, isotonicDecreasing: isotonicDecreasing,
    falseAlarmRate: falseAlarmRate, roundEstimate: roundEstimate, compare: compare, itemById: itemById,
    remainingTotal: remainingTotal
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.VSE = api;
})(this);

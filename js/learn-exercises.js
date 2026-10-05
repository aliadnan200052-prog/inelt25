/* ════════════════════════════════════════════════════════════════════════
   المسار — turning an entry into a question.

   One entry is asked several different ways, and which way depends on how
   well it is already known rather than on chance:

     not yet known   choose the Arabic meaning   (recognise)
     getting there   fill the gap in a sentence  (use it in context)
     known           write the English           (produce)

   Distractors come from the same unit, never from the whole bank. Three
   Arabic meanings drawn at random from a thousand words are all obviously
   wrong; three drawn from the same lesson make the learner actually read.

   The random source is injected so a test can pin it and get the same
   paper twice.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* A small deterministic generator. Math.random cannot be replayed, and a
     question that cannot be replayed cannot be debugged. */
  function rngFrom(seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }

  const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

  /* «كلمة» is wrong for a phrase and wronger for an idiom, and a learner
     reading a question that misnames what it is asking about loses a
     little trust in the whole thing. */
  const ASK_MEANING = {
    phr:   'ما معنى هذه العبارة؟',
    idiom: 'ما معنى هذا التعبير؟',
    fn:    'متى تقول هذه الجملة؟'
  };

  function shuffle(arr, rnd) {
    const r = arr.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }

  /* Three wrong answers from the same unit, by the field being asked
     about, with no repeats and nothing equal to the right answer. */
  function distractors(entry, unit, field, rnd, n) {
    const want = n || 3;
    const pool = unit.words.filter(e => e !== entry && e[field] && e[field] !== entry[field]);
    const seen = new Set(), out = [];
    shuffle(pool, rnd).forEach(e => {
      if (out.length >= want || seen.has(e[field])) return;
      seen.add(e[field]); out.push(e[field]);
    });
    return out;
  }

  const blankOut = (sentence, word) => {
    const head = word.split(' ')[0].replace(/y$/, '');
    const re = new RegExp('\\b' + head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*', 'i');
    return sentence.replace(re, '______');
  };

  const KINDS = {
    /* English in front of them, four Arabic meanings. The first meeting. */
    meaning(entry, unit, rnd) {
      const wrong = distractors(entry, unit, 'ar', rnd);
      if (wrong.length < 3) return null;
      const options = shuffle([entry.ar].concat(wrong), rnd);
      return {
        kind: 'meaning',
        ask: ASK_MEANING[entry.p] || 'ما معنى هذه الكلمة؟',
        prompt: entry.w,
        promptLang: 'en',
        options, optionsLang: 'ar',
        answer: options.indexOf(entry.ar),
        note: entry.lit || ''
      };
    },

    /* The sentence it lives in, with it taken out. Meaning is not enough;
       it has to fit. */
    gap(entry, unit, rnd) {
      if (entry.p === 'fn' || !entry.ex) return null;
      const gapped = blankOut(entry.ex, entry.w);
      if (gapped === entry.ex) return null;        // nothing was removed
      const wrong = distractors(entry, unit, 'w', rnd);
      if (wrong.length < 3) return null;
      const options = shuffle([entry.w].concat(wrong), rnd);
      return {
        kind: 'gap',
        ask: 'أكمل الفراغ',
        prompt: gapped,
        promptLang: 'en',
        options, optionsLang: 'en',
        answer: options.indexOf(entry.w),
        note: entry.ar
      };
    },

    /* Arabic in front of them, they write the English. No options to lean
       on — this is the one that proves the word is theirs. */
    produce(entry, unit, rnd) {
      if (entry.p === 'fn') return null;           // a whole sentence is not typed from memory
      return {
        kind: 'produce',
        ask: 'اكتب الكلمة بالإنكليزية',
        prompt: entry.ar,
        promptLang: 'ar',
        typed: true,
        answer: entry.w,
        hint: entry.ex ? blankOut(entry.ex, entry.w) : '',
        note: ''
      };
    },

    /* "It means ______ ?" — the exam's own way of testing an idiom, with
       the answer as one English word rather than an Arabic gloss. A
       learner who only ever meets the Arabic cannot answer it. */
    synonym(entry, unit, rnd) {
      if (!entry.syn) return null;
      const wrong = distractors(entry, unit, 'syn', rnd);
      if (wrong.length < 3) return null;
      const options = shuffle([entry.syn].concat(wrong), rnd);
      return {
        kind: 'synonym',
        ask: 'اختر المرادف الإنكليزي',
        prompt: entry.w + '  —  it means ?',
        promptLang: 'en',
        options, optionsLang: 'en',
        answer: options.indexOf(entry.syn),
        note: entry.ar
      };
    },

    /* For a function: the situation, and what you would say. */
    situation(entry, unit, rnd) {
      if (entry.p !== 'fn' || !entry.ex) return null;
      const wrong = distractors(entry, unit, 'w', rnd);
      if (wrong.length < 3) return null;
      const options = shuffle([entry.w].concat(wrong), rnd);
      return {
        kind: 'situation',
        ask: 'ماذا تقول في هذا الموقف؟',
        prompt: entry.ex,
        promptLang: 'en',
        options, optionsLang: 'en',
        answer: options.indexOf(entry.w),
        note: entry.ar
      };
    }
  };

  /* ── التوصيل ──────────────────────────────────────────────────────
     Five at once, tapped into pairs. It is the one shape that is faster
     than reading four options and more exacting than any of them: a
     wrong pairing is wrong twice over, because it also takes a meaning
     away from the word it belonged to.

     Only for entries not yet known — once a word is produced from
     memory, picking it out of five is no longer a test of anything. */
  const MATCH_MIN = 4, MATCH_MAX = 5;

  function buildMatch(entries, unit, seed) {
    const rnd = rngFrom(seed);
    const use = entries.slice(0, MATCH_MAX);
    if (use.length < MATCH_MIN) return null;
    // two entries sharing a meaning would make one pairing unanswerable
    if (new Set(use.map(e => e.ar)).size !== use.length) return null;
    const pairs = use.map(e => ({ id: unit.id + ':' + e.w, w: e.w, ar: e.ar, entry: e }));
    return {
      kind: 'match',
      ask: 'وصّل كل كلمة بمعناها',
      unit: unit.id,
      pairs,
      left:  shuffle(pairs.map(p => p.id), rnd),   // the English column
      right: shuffle(pairs.map(p => p.id), rnd),   // the Arabic column
      byId: Object.fromEntries(pairs.map(p => [p.id, p]))
    };
  }

  /* The ladder picks the shape, and anything that cannot be built falls
     back rather than leaving the learner with a blank card. */
  function build(entry, unit, level, seed) {
    const rnd = rngFrom(seed);
    /* A phrase or an idiom alternates between its Arabic meaning and its
       English synonym once it is past the first meeting, because the exam
       asks for both. */
    const order = entry.p === 'fn'
      ? ['situation', 'meaning']
      : (entry.p === 'phr' || entry.p === 'idiom')
        ? (level >= 3 ? ['synonym', 'gap', 'meaning']
           : level >= 1 ? ['synonym', 'gap', 'meaning']
           : ['meaning', 'synonym', 'gap'])
      : level >= 3 ? ['produce', 'gap', 'meaning']
      : level >= 1 ? ['gap', 'meaning']
      : ['meaning', 'gap'];
    for (const k of order) {
      const q = KINDS[k](entry, unit, rnd);
      if (q) { q.id = unit.id + ':' + entry.w; q.entry = entry; q.unit = unit.id; return q; }
    }
    return null;
  }

  const check = (q, given) => q.typed
    ? String(given || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase()
    : given === q.answer;

  global.LearnExercises = { build, buildMatch, check, rngFrom, blankOut, distractors, KINDS,
                            MATCH_MIN, MATCH_MAX };
})(typeof window !== 'undefined' ? window : globalThis);

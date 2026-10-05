/* ════════════════════════════════════════════════════════════════════════
   قواعد المسار — the booklet, turned into lessons that can be practised.

   The booklet was written to be read: thirteen parts, forty lessons, with
   67 questions scattered unevenly through them and eighteen lessons
   carrying none at all. This builds the track's grammar units from it at
   load time rather than duplicating the content, so the booklet stays the
   one copy of the material and a correction to it reaches the track.

     teach   the lesson's own blocks, rendered as they were written
     drills  the booklet's questions, plus the ones in
             learn-grammar-extra.js for the lessons that had none

   Every drill is multiple choice with four options, because the national
   exam is multiple choice from end to end.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const B = global.BOOKLET;
  const EXTRA = global.LEARN_GRAMMAR_EXTRA || {};
  if (!B) { global.LEARN_GRAMMAR = { units: [] }; return; }

  /* Four options, always. The booklet has a handful of three-option
     questions; a fourth is borrowed from a sibling question in the same
     lesson rather than invented, so nothing is put in a learner's way
     that was not already part of the material. */
  function toFour(q, siblings) {
    if (q.opts.length >= 4) return { q: q.q, opts: q.opts.slice(0, 4), a: q.a };
    const have = new Set(q.opts.map(o => o.toLowerCase()));
    const spare = [];
    siblings.forEach(s => s.opts.forEach(o => {
      if (!have.has(o.toLowerCase()) && !spare.includes(o)) spare.push(o);
    }));
    const opts = q.opts.concat(spare.slice(0, 4 - q.opts.length));
    return opts.length === 4 ? { q: q.q, opts, a: q.a } : null;
  }

  const units = [];
  B.parts.forEach((part, pi) => {
    const lessons = [];
    part.lessons.forEach((lesson, li) => {
      const id = 'g' + (pi + 1) + ':' + (li + 1);
      const own = lesson.body.filter(b => b.t === 'q');
      const drills = []
        .concat(own.map(q => toFour(q, own)).filter(Boolean))
        .concat(EXTRA[id] || []);
      lessons.push({
        id,
        ar: lesson.ar,
        en: lesson.en || '',
        teach: lesson.body.filter(b => b.t !== 'q'),
        drills
      });
    });
    units.push({
      id: 'g' + (pi + 1),
      kind: 'grammar',
      ar: part.ar,
      en: part.en || '',
      lessons
    });
  });

  global.LEARN_GRAMMAR = { units };
})(typeof window !== 'undefined' ? window : globalThis);

/* ════════════════════════════════════════════════════════════════════════
   المسار — progress, and when a thing is due again.

   Everything the learner's progress consists of goes through this one
   module. Today it sits in localStorage; moving it to an account later is
   meant to be a change to read() and write() and nothing else, which is
   why no other file is allowed to touch the key.

   The schedule is a Leitner ladder, deliberately plain:

     level   0    1    2    3    4     5     6
     days    —    1    3    7    16    35    90

   A right answer climbs one rung. A wrong answer drops two, never below
   zero, and puts the item back in the same session rather than days away:
   forgetting is the signal to practise now, not later.

   From level 3 a word is asked the other way round — the learner writes
   the English instead of picking the meaning — which is the difference
   between recognising a word and having it.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const KEY  = 'inelt.learn.v1';
  const DAY  = 24 * 60 * 60 * 1000;
  const DAYS = [0, 1, 3, 7, 16, 35, 90];
  const TOP  = DAYS.length - 1;
  const PRODUCE_FROM = 3;

  const blank = () => ({ items: {}, lessons: {}, meta: {} });

  /* The only two functions that know where progress lives. A private
     window, or a browser with storage switched off, throws on both —
     every call below is written so the path still works, it just forgets
     between visits. */
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const v = JSON.parse(raw);
      return (v && typeof v === 'object')
        ? { items: v.items || {}, lessons: v.lessons || {}, meta: v.meta || {} }
        : blank();
    } catch (e) { return blank(); }
  }
  function write(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  const freshItem = () => ({ level: 0, due: 0, seen: 0, right: 0, wrong: 0 });

  const API = {
    DAYS,
    PRODUCE_FROM,

    all() { return read(); },

    item(id) {
      const s = read();
      return s.items[id] ? Object.assign(freshItem(), s.items[id]) : freshItem();
    },

    /* What the next sitting should ask: everything whose due date has
       passed, oldest first, so the thing most at risk of being forgotten
       is asked first. An item never seen is not "due" — new material is
       introduced by its lesson, not by the review queue. */
    due(ids, now) {
      const s = read(), t = now || Date.now();
      return (ids || Object.keys(s.items))
        .filter(id => s.items[id] && s.items[id].due <= t)
        .sort((a, b) => s.items[a].due - s.items[b].due);
    },

    /* Asked as recognition, or as production? Not a stored flag: it falls
       out of how well the item is known, so it can never drift from it. */
    asksProduction(id) { return API.item(id).level >= PRODUCE_FROM; },

    grade(id, correct, now) {
      const s = read(), t = now || Date.now();
      const it = s.items[id] ? Object.assign(freshItem(), s.items[id]) : freshItem();
      it.seen++;
      if (correct) {
        it.right++;
        it.level = Math.min(it.level + 1, TOP);
        it.due = t + DAYS[it.level] * DAY;
      } else {
        it.wrong++;
        it.level = Math.max(it.level - 2, 0);
        it.due = t;                 // back in this sitting, not in days
      }
      s.items[id] = it;
      write(s);
      return it;
    },

    /* Introducing an item schedules it for the first time; it does not
       count as an answer, so it cannot flatter the numbers. */
    introduce(ids, now) {
      const s = read(), t = now || Date.now();
      (Array.isArray(ids) ? ids : [ids]).forEach(id => {
        if (s.items[id]) return;
        s.items[id] = Object.assign(freshItem(), { due: t + DAYS[1] * DAY });
      });
      write(s);
    },

    /* When it was first read is the fact worth keeping. Walking back over
       the last card of a lesson and forward again passes this way twice,
       and that is not a second reading. */
    lessonDone(lessonId, now) {
      const s = read();
      if (s.lessons[lessonId]) return;
      s.lessons[lessonId] = { at: now || Date.now() };
      write(s);
    },
    isLessonDone(lessonId) { return !!read().lessons[lessonId]; },

    /* Counts for the dashboard: known means it has survived long enough
       to be asked the hard way. */
    stats(now) {
      const s = read(), t = now || Date.now();
      const ids = Object.keys(s.items);
      let known = 0, learning = 0, dueNow = 0;
      ids.forEach(id => {
        const it = s.items[id];
        if (it.level >= PRODUCE_FROM) known++; else learning++;
        if (it.due <= t) dueNow++;
      });
      return {
        lessons: Object.keys(s.lessons).length,
        started: ids.length,
        known, learning, due: dueNow
      };
    },

    reset() { try { localStorage.removeItem(KEY); } catch (e) {} }
  };

  global.LearnStore = API;
})(typeof window !== 'undefined' ? window : globalThis);

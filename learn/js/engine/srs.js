// ════════════════════════════════════════════════════════════
// Spaced-review scheduler.
//
//   New → Learning → Review → Mastered      (a lapse returns to Learning)
//
// "Mastered" is never granted for one right answer: it needs a long
// interval, a streak, several task types including production, and
// several DIFFERENT contexts. See docs/DESIGN.md §8.
//
// All functions are pure and take `now` (ms) so they are testable.
// ════════════════════════════════════════════════════════════

export const MIN = 60 * 1000;
export const DAY = 24 * 60 * MIN;
export const LEARNING_STEPS = [20 * MIN, 1 * DAY];
export const MAX_INTERVAL_DAYS = 180;
export const TASKS = ['recognition', 'recall', 'production'];

export const MASTERY = {
  minIntervalDays: 21,
  minStreak: 3,
  minCorrect: 5,
  minTaskTypes: 2,
  minContexts: 3,
};

export function newState(itemId, now) {
  return {
    itemId,
    stage: 'new',
    step: 0,
    intervalDays: 0,
    ease: 2.3,
    due: now,
    reps: 0,
    lapses: 0,
    streak: 0,
    correctByTask: { recognition: 0, recall: 0, production: 0 },
    contexts: [],
    lastContext: null,
    learnedAt: null,
    lastSeen: null,
  };
}

/** The learner met the item in a lesson: it starts Learning, first review soon. */
export function introduce(state, now) {
  if (state.stage !== 'new') return state;
  return { ...state, stage: 'learning', step: 0, due: now + LEARNING_STEPS[0], learnedAt: now, lastSeen: now };
}

export function totalCorrect(s) {
  return TASKS.reduce((n, t) => n + (s.correctByTask?.[t] || 0), 0);
}

export function isMastered(s) {
  const types = TASKS.filter(t => (s.correctByTask?.[t] || 0) > 0).length;
  return s.intervalDays >= MASTERY.minIntervalDays
    && s.streak >= MASTERY.minStreak
    && totalCorrect(s) >= MASTERY.minCorrect
    && types >= MASTERY.minTaskTypes
    && (s.correctByTask?.production || 0) >= 1
    && (s.contexts?.length || 0) >= MASTERY.minContexts;
}

/**
 * Apply one answer.
 * @param quality 'again' (wrong) | 'hard' (right with hint/slip) | 'good' | 'easy'
 * @param task    'recognition' | 'recall' | 'production'
 * @param contextId the sentence the item was tested in (for recycling breadth)
 */
export function grade(state, { quality, task = 'recall', contextId = null }, now) {
  const s = {
    ...state,
    correctByTask: { ...state.correctByTask },
    contexts: [...(state.contexts || [])],
    reps: state.reps + 1,
    lastSeen: now,
    lastContext: contextId ?? state.lastContext,
    learnedAt: state.learnedAt ?? now,
  };

  if (quality === 'again') {
    if (state.stage === 'review' || state.stage === 'mastered') s.lapses = state.lapses + 1;
    s.stage = 'learning';
    s.step = 0;
    s.intervalDays = 0;
    s.streak = 0;
    s.ease = Math.max(1.3, round2(state.ease - 0.2));
    s.due = now + 10 * MIN;
    return s;
  }

  s.streak = state.streak + 1;
  s.correctByTask[task] = (s.correctByTask[task] || 0) + 1;
  if (contextId && !s.contexts.includes(contextId)) s.contexts.push(contextId);

  if (state.stage === 'new' || state.stage === 'learning') {
    const step = (state.stage === 'new' ? 0 : state.step) + 1;
    if (step >= LEARNING_STEPS.length) {
      s.stage = 'review';
      s.step = 0;
      s.intervalDays = quality === 'easy' ? 4 : quality === 'hard' ? 2 : 3;
      s.due = now + s.intervalDays * DAY;
    } else {
      s.stage = 'learning';
      s.step = step;
      s.due = now + LEARNING_STEPS[step];
    }
    return s;
  }

  // review / mastered
  const base = Math.max(1, state.intervalDays);
  let interval;
  if (quality === 'hard') { interval = base * 1.2; s.ease = Math.max(1.3, round2(state.ease - 0.15)); }
  else if (quality === 'easy') { interval = base * state.ease * 1.3; s.ease = round2(state.ease + 0.1); }
  else interval = base * state.ease;
  s.intervalDays = Math.min(MAX_INTERVAL_DAYS, round2(Math.max(interval, base + 1)));
  s.due = now + s.intervalDays * DAY;
  s.stage = isMastered(s) ? 'mastered' : 'review';
  return s;
}

/** Which kind of task should test this item next? Grows with the item. */
export function nextTask(state) {
  if (state.stage === 'new') return 'recognition';
  if (state.stage === 'learning') return 'recall';
  if (state.stage === 'mastered') return 'production';
  const c = state.correctByTask || {};
  // Alternate: make sure production keeps up with recall.
  const prod = c.production || 0, recall = c.recall || 0;
  return prod * 2 < recall || (prod === 0 && state.streak >= 1) ? 'production' : 'recall';
}

/**
 * Pick a context the learner has NOT answered correctly yet, never the
 * same sentence twice in a row. Falls back to any other sentence.
 */
export function pickContext(contexts, state, rand = Math.random) {
  if (!contexts || !contexts.length) return null;
  const seen = new Set(state?.contexts || []);
  const last = state?.lastContext;
  const fresh = contexts.filter(c => !seen.has(c.id) && c.id !== last);
  const pool = fresh.length ? fresh : contexts.filter(c => c.id !== last);
  const list = pool.length ? pool : contexts;
  return list[Math.floor(rand() * list.length)];
}

/** Due items, most urgent first: lapsed/learning, then most overdue relative to interval. */
export function dueQueue(states, now, { limit = 15, forced = [] } = {}) {
  const forcedSet = new Set(forced);
  const due = states.filter(s => s.stage !== 'new' && (s.due <= now || forcedSet.has(s.itemId)));
  const urgency = s => {
    if (forcedSet.has(s.itemId)) return 1e9;
    if (s.stage === 'learning') return 1e6 + (now - s.due);
    const interval = Math.max(1, s.intervalDays) * DAY;
    return (now - s.due) / interval;
  };
  return due.sort((a, b) => urgency(b) - urgency(a)).slice(0, limit);
}

export function stageCounts(states) {
  const out = { new: 0, learning: 0, review: 0, mastered: 0 };
  for (const s of states) out[s.stage] = (out[s.stage] || 0) + 1;
  return out;
}

/** Rough session length for the home screen: ~25 s per item. */
export function estimateMinutes(n) {
  return Math.max(1, Math.round((n * 25) / 60));
}

function round2(x) { return Math.round(x * 100) / 100; }

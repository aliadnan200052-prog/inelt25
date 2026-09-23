// ════════════════════════════════════════════════════════════
// Role-play engine: a character with a communicative goal list.
// The character reacts to what the learner actually wrote/said
// (pattern matching on intent). It is a fluency activity: errors
// are NOT corrected turn by turn — at most two are shown at the end.
// ════════════════════════════════════════════════════════════
import { containsPattern, normalize } from './text.js';
import { detectErrors } from './feedback.js';

/*
 Shape:
 {
   studentRole, characterRole, character, setting,
   goals: [{ id, label, patterns? }],   // patterns: credited on any turn
   start: "t1",
   turns: [{
     id, say,
     expect: [{ goal?, patterns: [regex…], reply, next }],
     fallback: { reply, hint }, model: "a model answer", next: "default next turn"
   }],
   useful: ["language worth using"]
 }
*/

export function start(rp) {
  const first = rp.start || rp.turns[0].id;
  return { turnId: first, goalsDone: [], misses: 0, errors: [], log: [{ who: 'character', text: turnById(rp, first).say }], ended: false };
}

export function turnById(rp, id) {
  return rp.turns.find(t => t.id === id);
}

/** Learner says something. Returns the new state and what happened. */
export function respond(rp, state, text) {
  if (state.ended) return { state, reply: null };
  const turn = turnById(rp, state.turnId);
  const said = String(text || '').trim();
  const s = { ...state, goalsDone: [...state.goalsDone], errors: [...state.errors], log: [...state.log, { who: 'student', text: said }] };

  for (const e of detectErrors(said, 2)) {
    if (!s.errors.some(x => x.id === e.id)) s.errors.push(e);
  }
  // A goal counts whenever the learner expresses it — on any turn, in any order.
  for (const g of rp.goals || []) {
    if (g.patterns && !s.goalsDone.includes(g.id) && containsPattern(said, g.patterns)) s.goalsDone.push(g.id);
  }

  const hit = normalize(said) ? (turn.expect || []).find(ex => containsPattern(said, ex.patterns)) : null;
  if (hit) {
    if (hit.goal && !s.goalsDone.includes(hit.goal)) s.goalsDone.push(hit.goal);
    return advance(rp, s, hit.reply, hit.next ?? turn.next, hit.goal || null);
  }

  s.misses = state.misses + 1;
  if (s.misses >= 3) {
    // Don't trap the learner: move the conversation on.
    return advance(rp, s, 'OK, no problem. Let\'s carry on.', turn.next ?? turn.expect?.[0]?.next, null, true);
  }
  const reply = turn.fallback?.reply || 'Sorry, could you say that again?';
  s.log.push({ who: 'character', text: reply });
  return {
    state: s, reply, matchedGoal: null,
    hint: turn.fallback?.hint || null,
    model: s.misses >= 2 ? turn.model || null : null,
  };
}

function advance(rp, s, reply, nextId, goal, skipped = false) {
  s.misses = 0;
  const lines = [];
  if (reply) lines.push(reply);
  if (!nextId || nextId === 'end') {
    s.ended = true;
  } else {
    s.turnId = nextId;
    const next = turnById(rp, nextId);
    if (next?.say) lines.push(next.say);
    if (next?.end) s.ended = true;
  }
  for (const l of lines) s.log.push({ who: 'character', text: l });
  return { state: s, reply: lines.join(' '), matchedGoal: goal, skipped };
}

export function summary(rp, state) {
  const goals = rp.goals.map(g => ({ ...g, done: state.goalsDone.includes(g.id) }));
  return {
    goals,
    achieved: goals.filter(g => g.done).length,
    total: goals.length,
    errors: state.errors.slice(0, 2), // fluency activity: only a couple, at the end
    useful: rp.useful || [],
  };
}

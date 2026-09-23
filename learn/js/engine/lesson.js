// ════════════════════════════════════════════════════════════
// Lesson structure: which stages a lesson has, in the order of
// the core loop, and whether the learner's evidence is enough
// to count the lesson as completed.
// ════════════════════════════════════════════════════════════

export const STAGE_DEFS = [
  { key: 'context',       label: 'Situation',        phase: 'Input',       has: l => !!l.context },
  { key: 'listen',        label: 'Listen',           phase: 'Input',       has: l => !!l.input },
  { key: 'read',          label: 'Read',             phase: 'Input',       has: l => !!l.reading },
  { key: 'notice',        label: 'Notice',           phase: 'Noticing',    has: l => !!l.notice?.length },
  { key: 'vocab',         label: 'Words & phrases',  phase: 'Noticing',    has: l => !!l.vocabulary?.length },
  { key: 'grammar',       label: 'Pattern',          phase: 'Noticing',    has: l => !!l.grammar },
  { key: 'practice',      label: 'Practice',         phase: 'Practice',    has: l => !!l.practice?.length },
  { key: 'pronunciation', label: 'Pronunciation',    phase: 'Practice',    has: l => !!l.pronunciation?.length },
  { key: 'retrieval',     label: 'Recall',           phase: 'Retrieval',   has: l => !!l.retrieval?.length },
  { key: 'speaking',      label: 'Speaking',         phase: 'Use',         has: l => !!l.speaking },
  { key: 'interaction',   label: 'Role-play',        phase: 'Interaction', has: l => !!l.interaction },
  { key: 'summary',       label: 'Summary',          phase: 'Review',      has: () => true },
];

export const PHASES = ['Input', 'Noticing', 'Practice', 'Retrieval', 'Use', 'Interaction', 'Review'];

/** Stages scored for completion. Speaking is practice, not graded. */
export const SCORED_STAGES = ['listen', 'read', 'notice', 'practice', 'pronunciation', 'retrieval', 'interaction'];
export const PASS_MARK = 0.6;

export function stagesFor(lesson) {
  return STAGE_DEFS.filter(d => d.has(lesson));
}

/** Items the lesson schedules for review when it is completed. */
export function reviewItemsFor(lesson) {
  const ids = new Set([...(lesson.review || lesson.vocabulary || [])]);
  if (lesson.grammar?.item) ids.add(lesson.grammar.item);
  return [...ids];
}

/** Add one scored attempt to a stage's running score. */
export function addScore(stageScores, stage, score) {
  const cur = stageScores[stage] || { sum: 0, n: 0 };
  return { ...stageScores, [stage]: { sum: cur.sum + score, n: cur.n + 1 } };
}

export function stageAverage(stageScores, stage) {
  const s = stageScores[stage];
  return s && s.n ? s.sum / s.n : null;
}

/**
 * completed — every stage visited and every scored stage ≥ PASS_MARK
 * revisit   — finished, but some stage was weak (can-dos not credited yet)
 */
export function outcome(lesson, stageScores, visited) {
  const stages = stagesFor(lesson).map(s => s.key);
  const allVisited = stages.every(k => k === 'summary' || visited.includes(k));
  const weak = SCORED_STAGES
    .filter(k => stages.includes(k))
    .map(k => ({ key: k, avg: stageAverage(stageScores, k) }))
    .filter(s => s.avg != null && s.avg < PASS_MARK);
  const scored = SCORED_STAGES.map(k => stageAverage(stageScores, k)).filter(v => v != null);
  const overall = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
  return {
    status: allVisited && !weak.length ? 'completed' : 'revisit',
    weak: weak.map(w => w.key),
    overall,
  };
}

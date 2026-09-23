// ════════════════════════════════════════════════════════════
// Progress model — evidence, not points.
// Computed from the attempt log, item states, lesson progress and
// speaking logs. See docs/DESIGN.md §7.
// ════════════════════════════════════════════════════════════
import { DAY, stageCounts } from './srs.js';

export const HALF_LIFE_DAYS = 30;
export const LEVEL_ORDER = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];
export const SECTION_PASS = 0.7;
export const VOCAB_READY = 0.7;

/** Recency-weighted accuracy for one skill. */
export function skillAccuracy(attempts, skill, now, { sources } = {}) {
  let w = 0, sum = 0, n = 0;
  for (const a of attempts) {
    if (a.skill !== skill) continue;
    if (sources && !sources.includes(a.source)) continue;
    const weight = Math.pow(0.5, (now - a.ts) / (HALF_LIFE_DAYS * DAY));
    w += weight; sum += weight * (a.score ?? (a.correct ? 1 : 0)); n++;
  }
  return { score: n ? sum / w : null, n };
}

/**
 * Retention: of review answers given ≥ 1 day after the item was learned
 * (last 30 days), the share that was correct.
 */
export function vocabRetention(attempts, statesById, now) {
  let ok = 0, n = 0;
  for (const a of attempts) {
    if (a.source !== 'review' || now - a.ts > 30 * DAY) continue;
    const learnedAt = Math.min(...(a.itemIds || []).map(id => statesById[id]?.learnedAt ?? Infinity));
    if (!isFinite(learnedAt) || a.ts - learnedAt < DAY) continue;
    n++; if (a.correct) ok++;
  }
  return { score: n ? ok / n : null, n };
}

export function speakingSummary(logs) {
  const out = { controlled: 0, guided: 0, free: 0, shadowing: 0, seconds: 0 };
  for (const l of logs) {
    out[l.mode] = (out[l.mode] || 0) + 1;
    out.seconds += l.seconds || 0;
  }
  out.minutes = Math.round(out.seconds / 60);
  return out;
}

export function lessonCounts(catalog, lessonProgress) {
  const byLevel = {};
  for (const lv of catalog.levels) byLevel[lv.code] = { done: 0, total: 0 };
  for (const l of catalog.lessons) {
    const lv = levelOfLesson(catalog, l.id);
    if (!byLevel[lv]) continue;
    byLevel[lv].total++;
    if (lessonProgress[l.id]?.status === 'completed') byLevel[lv].done++;
  }
  const done = Object.values(byLevel).reduce((a, b) => a + b.done, 0);
  return { byLevel, done };
}

/** The whole skill profile shown on the progress screen. */
export function profile({ attempts, states, lessonProgress, speakingLogs, catalog }, now) {
  const statesById = Object.fromEntries(states.map(s => [s.itemId, s]));
  const roleplay = attempts.filter(a => a.skill === 'functional');
  return {
    listening: skillAccuracy(attempts, 'listening', now),
    reading: skillAccuracy(attempts, 'reading', now),
    vocabulary: { ...vocabRetention(attempts, statesById, now), stages: stageCounts(states) },
    grammar: skillAccuracy(attempts, 'grammar', now),
    pronunciation: skillAccuracy(attempts, 'pronunciation', now),
    speaking: speakingSummary(speakingLogs),
    functional: { achieved: roleplay.filter(a => a.correct).length, attempted: roleplay.length },
    lessons: lessonCounts(catalog, lessonProgress),
  };
}

/** "What you can do now": can-do statements of completed lessons, by level. */
export function canDoNow(catalog, lessonProgress) {
  const out = [];
  for (const lv of catalog.levels) {
    const items = [];
    for (const l of lessonsOfLevel(catalog, lv.code)) {
      if (lessonProgress[l.id]?.status === 'completed') {
        for (const c of l.canDo || []) items.push({ text: c, lessonId: l.id });
      }
    }
    if (items.length) out.push({ level: lv.code, items });
  }
  return out;
}

/**
 * Readiness to leave a level. All checks must hold; the level check
 * itself is only offered once the first three hold.
 */
export function levelReadiness(level, { catalog, lessonProgress, states, items, speakingLogs, levelResults }) {
  const lessons = lessonsOfLevel(catalog, level);
  const done = lessons.filter(l => lessonProgress[l.id]?.status === 'completed').length;

  const levelItems = items.filter(i => i.level === level).map(i => i.id);
  const statesById = Object.fromEntries(states.map(s => [s.itemId, s]));
  const met = levelItems.filter(id => statesById[id] && statesById[id].stage !== 'new');
  const settled = met.filter(id => ['review', 'mastered'].includes(statesById[id].stage)).length;
  const vocabShare = levelItems.length ? settled / levelItems.length : 1;

  const units = catalog.units.filter(u => u.level === level);
  const unitOfLesson = Object.fromEntries(catalog.lessons.map(l => [l.id, l.unitId]));
  const spokenUnits = units.filter(u => {
    const logs = speakingLogs.filter(s => unitOfLesson[s.lessonId] === u.id);
    return logs.some(s => s.mode === 'guided') && logs.some(s => s.mode === 'free');
  }).length;

  const result = [...levelResults].reverse().find(r => r.level === level);
  const passed = !!levelResults.find(r => r.level === level && r.passed);

  const checks = [
    { id: 'lessons', label: 'Complete every lesson', done: lessons.length > 0 && done === lessons.length, detail: `${done} of ${lessons.length} lessons` },
    { id: 'vocab', label: `Keep ${Math.round(VOCAB_READY * 100)}% of the level's vocabulary out of "Learning"`, done: levelItems.length > 0 && vocabShare >= VOCAB_READY, detail: `${Math.round(vocabShare * 100)}% (${settled} of ${levelItems.length} items)` },
    { id: 'speaking', label: 'Do a guided and a free speaking task in every unit', done: units.length > 0 && spokenUnits === units.length, detail: `${spokenUnits} of ${units.length} units` },
    { id: 'check', label: `Pass the level check (every section ≥ ${Math.round(SECTION_PASS * 100)}%)`, done: passed, detail: result ? sectionDetail(result) : 'not taken yet' },
  ];
  return { level, checks, canTakeCheck: checks.slice(0, 3).every(c => c.done), passed };
}

function sectionDetail(r) {
  return Object.entries(r.sectionScores).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(' · ');
}

/** Grade a level check: every section must pass on its own. */
export function gradeLevelCheck(sectionScores) {
  const passed = Object.values(sectionScores).every(v => v >= SECTION_PASS);
  const weak = Object.entries(sectionScores).filter(([, v]) => v < SECTION_PASS).map(([k]) => k);
  return { passed, weak };
}

export function nextLevel(level) {
  const i = LEVEL_ORDER.indexOf(level);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;
}

export function levelAtMost(a, b) {
  return LEVEL_ORDER.indexOf(a) <= LEVEL_ORDER.indexOf(b);
}

export function lessonsOfLevel(catalog, level) {
  const unitIds = catalog.units.filter(u => u.level === level).sort((a, b) => a.sort - b.sort).map(u => u.id);
  return unitIds.flatMap(uid => catalog.lessons.filter(l => l.unitId === uid).sort((a, b) => a.sort - b.sort));
}

export function levelOfLesson(catalog, lessonId) {
  const l = catalog.lessons.find(x => x.id === lessonId);
  return catalog.units.find(u => u.id === l?.unitId)?.level;
}

/**
 * The lesson the learner needs next: an in-progress lesson first, then a
 * lesson marked "revisit", then the first not-started lesson at the
 * current level.
 */
export function nextLesson(catalog, lessonProgress, level) {
  const list = lessonsOfLevel(catalog, level).filter(l => l.status !== 'draft');
  return list.find(l => lessonProgress[l.id]?.status === 'in_progress')
    || list.find(l => !lessonProgress[l.id])
    || list.find(l => lessonProgress[l.id]?.status === 'revisit')
    || null;
}

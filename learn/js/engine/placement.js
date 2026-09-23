// ════════════════════════════════════════════════════════════
// Placement test — a staircase per skill.
//
// Each skill is tested in blocks of items at one CEFR level.
// Pass a block (≥ 2/3) → go up; fail → go down (if not yet tested).
// A skill's estimate is the highest level passed (none → A0).
// The next skill starts at the previous skill's estimate, so the
// test stays short. Speaking is NOT measured and the result says so.
// ════════════════════════════════════════════════════════════

export const LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];
export const TESTED = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const SKILLS = ['grammar', 'vocabulary', 'reading', 'listening'];
export const BLOCK_PASS = 2 / 3;

export function create(bank, { start = 'A2' } = {}) {
  const skills = SKILLS.filter(s => bank.sections?.[s]);
  const st = {
    skills,
    si: 0,
    results: {},        // skill → { passed: idx|-1, failed: idx|null, blocks: [] }
    block: null,
    answered: 0,
  };
  return openBlock(bank, st, skills[0], TESTED.indexOf(start));
}

function openBlock(bank, st, skill, levelIdx) {
  const level = TESTED[levelIdx];
  const blk = bank.sections[skill]?.[level];
  if (!blk || !blk.items?.length) return { ...st, block: null };
  return {
    ...st,
    results: { ...st.results, [skill]: st.results[skill] || { passed: -1, failed: null, blocks: [] } },
    block: { skill, levelIdx, level, i: 0, correct: 0, n: blk.items.length },
  };
}

/** The current question, with its shared stimulus (reading text / listening script). */
export function current(bank, st) {
  if (!st.block) return null;
  const { skill, level, i, n } = st.block;
  const blk = bank.sections[skill][level];
  return {
    skill, level, index: i, of: n,
    item: blk.items[i],
    text: blk.text || null,
    script: blk.script || null,
    progress: progress(st),
  };
}

export function answer(bank, st, correct) {
  if (!st.block) return st;
  const b = { ...st.block, i: st.block.i + 1, correct: st.block.correct + (correct ? 1 : 0) };
  const s = { ...st, answered: st.answered + 1, block: b };
  if (b.i < b.n) return s;

  // Block finished.
  const passed = b.correct / b.n >= BLOCK_PASS - 1e-9;
  const r = { ...s.results[b.skill] };
  r.blocks = [...r.blocks, { level: b.level, correct: b.correct, n: b.n, passed }];
  if (passed) r.passed = Math.max(r.passed, b.levelIdx);
  else r.failed = r.failed == null ? b.levelIdx : Math.min(r.failed, b.levelIdx);
  s.results = { ...s.results, [b.skill]: r };

  let nextIdx = null;
  if (passed && b.levelIdx + 1 < TESTED.length && (r.failed == null || r.failed > b.levelIdx + 1)) nextIdx = b.levelIdx + 1;
  if (!passed && b.levelIdx - 1 >= 0 && r.passed < b.levelIdx - 1) nextIdx = b.levelIdx - 1;
  if (nextIdx != null) return openBlock(bank, s, b.skill, nextIdx);

  // Skill finished → next skill, starting at this skill's estimate.
  const si = s.si + 1;
  if (si >= s.skills.length) return { ...s, si, block: null };
  const startIdx = Math.min(TESTED.length - 1, Math.max(0, r.passed));
  return openBlock(bank, { ...s, si }, s.skills[si], startIdx);
}

export function done(st) {
  return !st.block;
}

function progress(st) {
  return { skill: st.si + 1, skills: st.skills.length, answered: st.answered };
}

/** Level index 0..5 for a skill: highest passed tested level (+1 offset for A0). */
function estimateIdx(r) {
  return r ? r.passed + 1 : 0;
}

export function result(st) {
  const bySkill = {};
  for (const s of st.skills) bySkill[s] = LEVELS[estimateIdx(st.results[s])];
  const idxs = st.skills.map(s => estimateIdx(st.results[s]));
  const mean = idxs.reduce((a, b) => a + b, 0) / (idxs.length || 1);
  const overallIdx = Math.max(0, Math.min(LEVELS.length - 1, Math.floor(mean + 0.25)));
  const strengths = st.skills.filter(s => estimateIdx(st.results[s]) > overallIdx);
  const weaknesses = st.skills.filter(s => estimateIdx(st.results[s]) < overallIdx);
  return {
    overall: LEVELS[overallIdx],
    bySkill,
    strengths,
    weaknesses,
    answered: st.answered,
    measured: st.skills,
    notMeasured: ['speaking', 'pronunciation'],
  };
}

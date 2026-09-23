import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchAnswer, canonical, wordDiff, containsPattern, makeCloze, firstLetterHint } from '../js/engine/text.js';
import { detectErrors, checkExercise, checkProduction, qualityFrom } from '../js/engine/feedback.js';
import * as srs from '../js/engine/srs.js';
import { buildTask, answerTask, buildSession } from '../js/engine/review.js';
import * as rp from '../js/engine/roleplay.js';
import * as placement from '../js/engine/placement.js';
import { outcome, stagesFor, addScore } from '../js/engine/lesson.js';
import { levelReadiness, gradeLevelCheck, nextLesson, canDoNow } from '../js/engine/progress.js';

const { DAY, MIN } = srs;

test('contractions and punctuation do not matter', () => {
  assert.equal(canonical("I'm going to call him."), 'i am going to call him');
  assert.ok(matchAnswer("I am going to call him", ["I'm going to call him."]).correct);
  assert.ok(matchAnswer("  I’d LIKE a coffee ", ["I'd like a coffee"]).correct);
  assert.ok(matchAnswer("I haven't decided", ["I have not decided"]).correct);
});

test('spelling slips are "near", grammar words are not', () => {
  const r = matchAnswer('make a desicion', ['make a decision']);
  assert.equal(r.correct, false);
  assert.equal(r.near, true);
  assert.equal(matchAnswer('interested on', ['interested in']).near, false);
  assert.equal(matchAnswer('go', ['went']).near, false);
});

test('common errors are detected with a better version and a reason', () => {
  const [e] = detectErrors('I am agree with you');
  assert.equal(e.id, 'be-agree');
  assert.equal(e.better, 'I agree');
  assert.match(e.why, /verb/);
  assert.equal(detectErrors('We discussed about the plan')[0].better, 'discussed');
  assert.equal(detectErrors('I have 20 years')[0].id, 'have-years');
  assert.equal(detectErrors('She work in a bank')[0].better, 'she works');
  assert.equal(detectErrors('Does she work in a bank?').length, 0, 'no false positive after "does"');
  assert.equal(detectErrors('I did a big decision')[0].better, 'made a big decision');
  assert.equal(detectErrors('I made a decision yesterday').length, 0);
});

test('gap exercise feedback: anticipated error beats generic', () => {
  const ex = { type: 'gap', text: 'I ___ with you.', answers: ['agree'], errors: [{ match: 'am agree', why: 'Agree is a verb.' }] };
  const r = checkExercise(ex, 'am agree');
  assert.equal(r.correct, false);
  assert.equal(r.feedback.better, 'I agree with you.');
  assert.equal(r.feedback.why, 'Agree is a verb.');
  assert.ok(checkExercise(ex, 'agree').correct);
});

test('production needs the target and no detected errors', () => {
  const ex = { type: 'produce', target: ['mak(e|es|ing)|made'], targetLabel: 'make a decision', sample: '' };
  assert.equal(checkProduction({ ...ex, target: ['ma(ke|de|kes|king) (a|the|my|this|that|your|any) decision'] }, 'I need to make a decision soon.').correct, true);
  const noTarget = checkProduction({ ...ex, target: ['ma(ke|de) a decision'] }, 'I like my new job a lot.');
  assert.equal(noTarget.correct, false);
  assert.equal(noTarget.usesTarget, false);
  const withError = checkProduction({ ...ex, target: ['decision'] }, 'People is waiting for my decision.');
  assert.equal(withError.correct, false);
  assert.equal(withError.near, true);
  assert.match(withError.feedback.better, /people are/i);
});

test('dictation marks missing words only', () => {
  const d = wordDiff('I usually get up at seven', 'I get up at seven');
  assert.deepEqual(d.words.map(w => w.ok), [true, false, true, true, true, true]);
});

test('helpers: cloze, hint, patterns', () => {
  const c = makeCloze('Have you made a decision yet?', 'made a decision');
  assert.equal(c.before, 'Have you ');
  assert.equal(firstLetterHint('made a decision'), 'm___ a d_______');
  assert.ok(containsPattern("I'm going to visit my aunt", ['going to \\w+']));
});

test('SRS: wrong answers come back sooner, right ones later', () => {
  const t0 = Date.UTC(2026, 0, 1);
  let s = srs.introduce(srs.newState('x', t0), t0);
  assert.equal(s.stage, 'learning');
  s = srs.grade(s, { quality: 'good', task: 'recall', contextId: 'c1' }, t0 + 20 * MIN);
  assert.equal(s.stage, 'learning');
  assert.equal(s.due, t0 + 20 * MIN + DAY);
  s = srs.grade(s, { quality: 'good', task: 'recall', contextId: 'c2' }, t0 + DAY);
  assert.equal(s.stage, 'review');
  assert.equal(s.intervalDays, 3);
  const wrong = srs.grade(s, { quality: 'again', task: 'recall' }, t0 + 4 * DAY);
  assert.equal(wrong.stage, 'learning');
  assert.equal(wrong.lapses, 1);
  assert.equal(wrong.due, t0 + 4 * DAY + 10 * MIN);
  const right = srs.grade(s, { quality: 'good', task: 'recall', contextId: 'c3' }, t0 + 4 * DAY);
  assert.ok(right.intervalDays > 3);
});

test('SRS: "mastered" needs several contexts, a production task and a long interval', () => {
  let t = Date.UTC(2026, 0, 1);
  let s = srs.introduce(srs.newState('x', t), t);
  // Many right answers, but always the SAME context and never production.
  for (let i = 0; i < 12; i++) {
    t = s.due;
    s = srs.grade(s, { quality: 'good', task: 'recall', contextId: 'same' }, t);
  }
  assert.ok(s.intervalDays >= 21);
  assert.notEqual(s.stage, 'mastered', 'one context, no production → not mastered');
  // Now varied contexts + production.
  for (const [task, ctx] of [['recall', 'c2'], ['production', 'own'], ['recall', 'c3']]) {
    t = s.due;
    s = srs.grade(s, { quality: 'good', task, contextId: ctx }, t);
  }
  assert.equal(s.stage, 'mastered');
  // One lapse demotes it.
  s = srs.grade(s, { quality: 'again', task: 'recall' }, s.due);
  assert.equal(s.stage, 'learning');
});

test('SRS: a single right answer never masters an item', () => {
  const t = Date.UTC(2026, 0, 1);
  const s = srs.grade({ ...srs.newState('x', t), stage: 'review', intervalDays: 30, streak: 0 }, { quality: 'easy', task: 'production', contextId: 'a' }, t);
  assert.equal(s.stage, 'review');
});

test('SRS: queue puts lapsed items first, forced items always', () => {
  const now = Date.UTC(2026, 0, 10);
  const states = [
    { ...srs.newState('a', 0), stage: 'review', intervalDays: 10, due: now - DAY },
    { ...srs.newState('b', 0), stage: 'learning', due: now - MIN },
    { ...srs.newState('c', 0), stage: 'review', intervalDays: 2, due: now - DAY },
    { ...srs.newState('d', 0), stage: 'review', intervalDays: 5, due: now + 5 * DAY },
  ];
  assert.deepEqual(srs.dueQueue(states, now).map(s => s.itemId), ['b', 'c', 'a']);
  assert.equal(srs.dueQueue(states, now, { forced: ['d'] })[0].itemId, 'd');
});

test('review picks a context not answered yet (recycling)', () => {
  const item = {
    id: 'mad', kind: 'collocation', form: 'make a decision', meaning: 'decide', match: ['decision'],
    contexts: [
      { id: 'c1', sentence: 'I need to make a decision.', cloze: 'make a decision' },
      { id: 'c2', sentence: 'Have you made a decision yet?', cloze: 'made a decision' },
    ],
  };
  const state = { ...srs.newState('mad', 0), stage: 'learning', contexts: ['c1'], lastContext: 'c1' };
  const task = buildTask(item, state, [item]);
  assert.equal(task.contextId, 'c2');
  assert.equal(task.exercise.text, 'Have you ___ yet?');
  const { state: next, check } = answerTask(task, state, 'made a decision', Date.now());
  assert.ok(check.correct);
  assert.deepEqual(next.contexts, ['c1', 'c2']);
});

test('review session only uses known items', () => {
  const now = Date.now();
  const items = { a: { id: 'a', kind: 'word', form: 'busy', meaning: 'having a lot to do', contexts: [] } };
  const states = [{ ...srs.newState('a', 0), stage: 'learning', due: now - 1 }, { ...srs.newState('gone', 0), stage: 'learning', due: now - 1 }];
  const tasks = buildSession(items, states, now);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].exercise.type, 'recall');
});

test('role-play reacts to intent and tracks goals', () => {
  const play = {
    goals: [{ id: 'order', label: 'Order' }, { id: 'pay', label: 'Pay' }],
    turns: [
      { id: 't1', say: 'What can I get you?', expect: [{ goal: 'order', patterns: ['coffee|tea'], reply: 'Sure.', next: 't2' }], fallback: { reply: 'Sorry?', hint: 'Say a drink.' }, model: 'A coffee, please.' },
      { id: 't2', say: 'Anything else?', expect: [{ goal: 'pay', patterns: ['how much|bill'], reply: 'Three pounds.', next: 'end' }] },
    ],
  };
  let st = rp.start(play);
  let r = rp.respond(play, st, 'hello');
  assert.equal(r.hint, 'Say a drink.');
  r = rp.respond(play, r.state, 'I am agree, a coffee please');
  assert.equal(r.matchedGoal, 'order');
  r = rp.respond(play, r.state, 'How much is it?');
  assert.ok(r.state.ended);
  const sum = rp.summary(play, r.state);
  assert.equal(sum.achieved, 2);
  assert.equal(sum.errors[0].id, 'be-agree', 'errors are collected, shown only at the end');
});

test('placement staircase goes up on pass and stops on fail', () => {
  const block = n => ({ items: Array.from({ length: n }, (_, i) => ({ id: i })) });
  const lv = { A1: block(3), A2: block(3), B1: block(3), B2: block(3), C1: block(3) };
  const bank = { sections: { grammar: lv, vocabulary: lv } };
  let st = placement.create(bank, { start: 'A2' });
  const answerBlock = ok => { for (let i = 0; i < 3; i++) st = placement.answer(bank, st, ok); };
  answerBlock(true);  // A2 pass → B1
  assert.equal(st.block.level, 'B1');
  answerBlock(false); // B1 fail → done with grammar (A2 already passed)
  assert.equal(st.block.skill, 'vocabulary');
  assert.equal(st.block.level, 'A2', 'next skill starts at previous estimate');
  answerBlock(false); // A2 fail → A1
  assert.equal(st.block.level, 'A1');
  answerBlock(false); // A1 fail → A0
  assert.ok(placement.done(st));
  const res = placement.result(st);
  assert.equal(res.bySkill.grammar, 'A2');
  assert.equal(res.bySkill.vocabulary, 'A0');
  assert.deepEqual(res.notMeasured, ['speaking', 'pronunciation']);
});

test('lesson counts as completed only with enough evidence in every scored stage', () => {
  const lesson = { context: {}, input: {}, practice: [{}], retrieval: [{}] };
  const visited = stagesFor(lesson).map(s => s.key);
  let sc = addScore({}, 'listen', 1);
  sc = addScore(sc, 'practice', 1);
  sc = addScore(sc, 'retrieval', 0);
  sc = addScore(sc, 'retrieval', 1);
  assert.equal(outcome(lesson, sc, visited).status, 'revisit');
  sc = addScore(sc, 'retrieval', 1);
  assert.equal(outcome(lesson, sc, visited).status, 'completed');
  assert.equal(outcome(lesson, sc, ['context']).status, 'revisit');
});

test('level check: a strong section cannot hide a weak one', () => {
  assert.equal(gradeLevelCheck({ listening: 1, reading: 1, vocabulary: 1, grammar: 0.5 }).passed, false);
  assert.equal(gradeLevelCheck({ listening: 0.7, reading: 0.8, vocabulary: 0.75, grammar: 0.7 }).passed, true);
});

test('readiness, next lesson and can-dos', () => {
  const catalog = {
    levels: [{ code: 'A1' }],
    units: [{ id: 'u1', level: 'A1', sort: 1 }],
    lessons: [{ id: 'l1', unitId: 'u1', sort: 1, canDo: ['I can say hello.'] }, { id: 'l2', unitId: 'u1', sort: 2 }],
  };
  const lp = { l1: { status: 'completed' } };
  assert.equal(nextLesson(catalog, lp, 'A1').id, 'l2');
  assert.deepEqual(canDoNow(catalog, lp)[0].items.map(i => i.text), ['I can say hello.']);
  const r = levelReadiness('A1', { catalog, lessonProgress: lp, states: [], items: [], speakingLogs: [], levelResults: [] });
  assert.equal(r.canTakeCheck, false);
  assert.equal(r.checks[0].detail, '1 of 2 lessons');
});

// Validates every shipped content file with the same schema the admin panel uses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validateLesson, validateItem, validateCatalog, validateExercise, codecs, youtubeId } from '../js/data/content-schema.js';
import { containsPattern } from '../js/engine/text.js';
import * as placement from '../js/engine/placement.js';

const dir = new URL('../content/', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, dir), 'utf8'));
const catalog = read('catalog.json');
const items = read('items.json');
const videos = read('videos.json');
const lessonFiles = readdirSync(new URL('lessons/', dir)).filter(f => f.endsWith('.json'));
const lessons = lessonFiles.map(f => read(`lessons/${f}`));
const itemIds = new Set(items.map(i => i.id));
const videoIds = new Set(videos.map(v => v.id));

test('item bank is valid and ids are unique', () => {
  assert.equal(itemIds.size, items.length, 'duplicate item id');
  const errors = items.flatMap(validateItem);
  assert.deepEqual(errors, []);
});

test('every item example is recognised by its own match patterns', () => {
  const misses = items.filter(i => i.match?.length && !containsPattern(i.example, i.match)).map(i => i.id);
  assert.deepEqual(misses, []);
});

test('catalog is consistent with lesson files', () => {
  assert.deepEqual(validateCatalog(catalog, new Set(lessons.map(l => l.id))), []);
  for (const f of lessonFiles) assert.ok(catalog.lessons.some(l => `${l.id}.json` === f), `${f} not in catalog`);
});

test('every lesson validates (SLA structure, references, exercise shapes)', () => {
  const errors = lessons.flatMap(l => validateLesson(l, { itemIds, videoIds }));
  assert.deepEqual(errors, []);
});

test('every level has content, and key items are recycled across levels', () => {
  for (const lv of catalog.levels) assert.ok(catalog.units.some(u => u.level === lv.code), `${lv.code} has no units`);
  const mad = items.find(i => i.id === 'make-a-decision');
  const levels = new Set(mad.contexts.map(c => catalog.units.find(u => u.id === catalog.lessons.find(l => l.id === c.lesson)?.unitId)?.level));
  assert.ok(levels.size >= 4, 'make a decision should come back at 4+ levels');
  const recycled = lessons.filter(l => (l.recycle || []).length).length;
  assert.ok(recycled >= lessons.length - 2, 'most lessons recycle earlier items');
});

test('placement bank and level checks are well formed', () => {
  const bank = read('placement.json');
  for (const [skill, byLevel] of Object.entries(bank.sections)) {
    for (const lv of placement.TESTED) {
      assert.ok(byLevel[lv]?.items?.length === 3, `${skill} ${lv} needs 3 items`);
      for (const ex of byLevel[lv].items) assert.deepEqual(validateExercise({ skill, ...ex }, `placement ${skill}`), []);
    }
  }
  const checks = read('assessments.json');
  for (const lv of catalog.levels) {
    const a = checks[lv.code];
    assert.ok(a, `no level check for ${lv.code}`);
    assert.deepEqual(a.sections.map(s => s.skill).sort(), ['grammar', 'listening', 'reading', 'vocabulary']);
    for (const s of a.sections) for (const ex of s.items) assert.deepEqual(validateExercise({ skill: s.skill, ...ex }, `check ${lv.code}`), []);
  }
});

test('admin line formats round-trip', () => {
  const script = '[0:05] Sara: Hi! I\'m Sara.\nOmar: Hello.';
  assert.equal(codecs.script.format(codecs.script.parse(script)), script);
  const stress = 'ho-TEL\nAP-ple';
  assert.equal(codecs.pron.stress.format(codecs.pron.stress.parse(stress)), stress);
  const ss = '*Where* are you *from?*';
  assert.deepEqual(codecs.pron['sentence-stress'].parse(ss).sentences[0].stressed, [0, 3]);
  const sc = '/s/ | /z/\ngets: /s/\nleaves: /z/';
  assert.equal(codecs.pron['sound-choice'].format(codecs.pron['sound-choice'].parse(sc)), sc);
});

test('YouTube ids are extracted from the usual URL forms', () => {
  for (const u of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ?t=3', 'https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'])
    assert.equal(youtubeId(u), 'dQw4w9WgXcQ', u);
  assert.equal(youtubeId('https://example.com/video'), null);
});

test('every role-play can be completed with its model answers, achieving all goals', async () => {
  const rp = await import('../js/engine/roleplay.js');
  const problems = [];
  for (const l of lessons.filter(x => x.interaction)) {
    const play = l.interaction;
    let st = rp.start(play);
    for (let guard = 0; guard < 20 && !st.ended; guard++) {
      const turn = rp.turnById(play, st.turnId);
      const r = rp.respond(play, st, turn.model);
      if (r.hint) { problems.push(`${l.id} ${turn.id}: model answer "${turn.model}" not understood`); break; }
      st = r.state;
    }
    if (!st.ended) problems.push(`${l.id}: conversation did not end`);
    const missing = play.goals.filter(g => !st.goalsDone.includes(g.id)).map(g => g.id);
    if (missing.length) problems.push(`${l.id}: goals not reached with model answers: ${missing.join(', ')}`);
    if (st.errors.length) problems.push(`${l.id}: model answers trigger error rules: ${st.errors.map(e => e.id).join(', ')}`);
  }
  assert.deepEqual(problems, []);
});

test('model answers and samples in retrieval pass their own checks', async () => {
  const { checkExercise } = await import('../js/engine/feedback.js');
  const problems = [];
  for (const l of lessons) {
    for (const ex of [...(l.retrieval || []), ...(l.practice || [])]) {
      if (ex.type === 'produce' && ex.sample && !checkExercise(ex, ex.sample).correct) problems.push(`${l.id} ${ex.id}: sample fails`);
      if (['gap', 'recall', 'transform', 'correct', 'order'].includes(ex.type) && !checkExercise(ex, ex.answers[0]).correct) problems.push(`${l.id} ${ex.id}: first answer fails`);
    }
  }
  assert.deepEqual(problems, []);
});

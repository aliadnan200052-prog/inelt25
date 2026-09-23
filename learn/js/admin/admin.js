// ════════════════════════════════════════════════════════════
// Admin panel — content management, separate from the learning
// engine. Reads and writes only through the ContentRepository, and
// validates everything with js/data/content-schema.js.
// ════════════════════════════════════════════════════════════
import { h, button, add, put } from '../ui/dom.js';
import { LocalContentRepository } from '../data/content-repo.js';
import {
  ENTITY_FIELDS, LEVELS, validateLesson, validateItem, validateCatalog, validateRoleplay,
  blankLesson, ROLEPLAY_TEMPLATE, youtubeId, parseDuration, RETRIEVAL_TYPES, EXERCISE_TYPES,
} from '../data/content-schema.js';
import { renderForm, errorList, exerciseList, pronunciationList } from './forms.js';
import * as roleplay from '../engine/roleplay.js';
import { profile as skillProfile, canDoNow } from '../engine/progress.js';
import { stageCounts } from '../engine/srs.js';
import { TESTED } from '../engine/placement.js';

const repo = new LocalContentRepository();
const nav = document.getElementById('admin-nav');
const main = document.getElementById('admin-main');
const S = { section: 'overview', lessonId: null, tab: 'meta', flash: null };
let D = {};

const SECTIONS = [
  ['overview', 'Overview & publishing'],
  ['structure', 'Levels, units & lessons'],
  ['lesson', 'Lesson editor'],
  ['videos', 'YouTube videos'],
  ['items', 'Vocabulary & grammar items'],
  ['assessments', 'Placement & level checks'],
  ['schedules', 'Review schedules'],
  ['students', 'Student progress'],
];

async function load() {
  const [catalog, items, videos, placement, assessments, schedules] = await Promise.all([
    repo.getCatalog(), repo.getItems(), repo.getVideos(), repo.getPlacement(), repo.getAssessments(), repo.getSchedules(),
  ]);
  D = { catalog: structuredClone(catalog), items: structuredClone(items), videos: structuredClone(videos), placement: structuredClone(placement), assessments: structuredClone(assessments), schedules: structuredClone(schedules) };
}

const ctx = () => ({ itemIds: D.items.map(i => i.id), units: D.catalog.units });
const flash = (msg, kind = 'ok') => { S.flash = { msg, kind }; };
function go(section, extra = {}) { Object.assign(S, { section, ...extra }); render(); }

function render() {
  put(nav, ...SECTIONS.map(([k, label]) => h('button', { type: 'button', 'aria-current': S.section === k ? 'true' : 'false', on: { click: () => go(k) } }, label)));
  const f = S.flash; S.flash = null;
  put(main,
    f ? h(f.kind === 'ok' ? 'div.a-ok' : 'div.a-errors', { role: 'status' }, f.msg) : null,
    repo.hasLocalEdits() ? h('div.a-note', 'You have unpublished edits saved in this browser. Students elsewhere see them only after you export the bundle and publish it (see Overview).') : null,
    VIEWS[S.section]());
  main.focus({ preventScroll: true });
}

// ─── Overview ──────────────────────────────────────────────────
const VIEWS = {};
VIEWS.overview = () => {
  const wrap = h('div');
  const validation = h('div', h('p.muted', 'Checking all content…'));
  (async () => {
    const errors = [...validateCatalog(D.catalog), ...D.items.flatMap(validateItem)];
    const itemIds = new Set(D.items.map(i => i.id)), videoIds = new Set(D.videos.map(v => v.id));
    for (const l of D.catalog.lessons) {
      try { errors.push(...validateLesson(await repo.getLesson(l.id), { itemIds, videoIds })); }
      catch (e) { errors.push(`lesson ${l.id}: ${e.message}`); }
    }
    put(validation, errors.length ? errorList(errors) : h('div.a-ok', 'All content is valid: every lesson follows the learning loop, and every referenced item and video exists.'));
  })();
  const fileInput = h('input', { type: 'file', accept: '.json,application/json', hidden: true, on: { change: async e => {
    const file = e.target.files[0]; if (!file) return;
    try { await repo.importBundle(JSON.parse(await file.text())); await load(); flash('Bundle imported into this browser.'); render(); }
    catch (err) { flash(err.message, 'error'); render(); }
  } } });
  add(wrap,
    h('h2', 'Overview'),
    h('div.stat-row',
      stat('Levels', D.catalog.levels.length), stat('Units', D.catalog.units.length),
      stat('Lessons', `${D.catalog.lessons.length} (${D.catalog.lessons.filter(l => l.status === 'draft').length} draft)`),
      stat('Items', `${D.items.length} (${D.items.filter(i => i.kind === 'grammar').length} grammar patterns)`),
      stat('Videos', D.videos.length), stat('Review schedules', D.schedules.length)),
    h('section.card',
      h('h3', 'Publishing'),
      h('p', 'This static build keeps your edits in this browser. To publish them for every student:'),
      h('ol.plain',
        h('li', 'Export the content bundle below.'),
        h('li', 'Commit its parts to /learn/content (catalog.json, items.json, videos.json, placement.json, assessments.json, lessons/<id>.json) — or run `node learn/tools/apply-bundle.mjs bundle.json` from the repository.'),
        h('li', 'For live multi-user publishing, connect the Postgres schema in learn/db/schema.sql and swap the repository adapter.')),
      h('div.a-toolbar',
        button('Export content bundle', async () => download('learn-content-bundle.json', await repo.exportBundle()), 'btn-primary btn-sm'),
        button('Import bundle', () => fileInput.click(), 'btn-ghost btn-sm'), fileInput,
        repo.hasLocalEdits() ? button('Discard local edits', async () => { if (confirm('Discard all unpublished edits in this browser?')) { await repo.discardLocalEdits(); await load(); flash('Local edits discarded.'); render(); } }, 'btn-danger btn-sm') : null)),
    h('section.card', h('h3', 'Content check'), validation),
  );
  return wrap;
};

function stat(label, value) { return h('div.stat', h('p.section-label', label), h('p', String(value))); }
function download(name, data) {
  const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })), download: name });
  document.body.appendChild(a); a.click(); a.remove();
}

// ─── Structure: levels, units, lessons ────────────────────────
VIEWS.structure = () => {
  const wrap = h('div', h('h2', 'Levels, units & lessons'), h('p.muted', 'A0 → C1. Inside each level: units → lessons → level check. Lessons are ordered by their "order" number.'));
  for (const lv of [...D.catalog.levels].sort((a, b) => a.sort - b.sort)) {
    const units = D.catalog.units.filter(u => u.level === lv.code).sort((a, b) => a.sort - b.sort);
    add(wrap, h('section.card',
      h('div.a-toolbar', h('h3', `${lv.code} · ${lv.name}`), h('span.spacer'),
        button('Edit level', () => editEntity('level', lv, v => { Object.assign(lv, v); return saveCatalog(); }), 'btn-ghost btn-sm'),
        button('Add unit', () => editEntity('unit', { id: `${lv.code.toLowerCase()}-u${units.length + 1}`, level: lv.code, title: '', sort: units.length + 1 }, v => {
          if (D.catalog.units.some(u => u.id === v.id)) return ['A unit with this id exists'];
          D.catalog.units.push(v); return saveCatalog();
        }), 'btn-ghost btn-sm')),
      h('p.muted.small', lv.summary),
      units.map(u => {
        const lessons = D.catalog.lessons.filter(l => l.unitId === u.id).sort((a, b) => a.sort - b.sort);
        return h('div.a-block',
          h('div.a-block-head', h('strong', `${u.title}`), h('span.muted.small', u.id),
            button('Edit', () => editEntity('unit', u, v => { Object.assign(u, v); return saveCatalog(); }), 'btn-ghost btn-sm'),
            button('Add lesson', () => newLesson(u, lessons.length + 1), 'btn-ghost btn-sm'),
            button('Delete', async () => {
              if (lessons.length) return alert('Move or delete its lessons first.');
              if (!confirm(`Delete unit ${u.id}?`)) return;
              D.catalog.units = D.catalog.units.filter(x => x !== u); await saveCatalog(); render();
            }, 'btn-ghost btn-sm')),
          lessons.length ? h('div.a-wrap', h('table.a-table', h('thead', h('tr', ['#', 'Lesson', 'Topic', 'Status', ''].map(t => h('th', t)))),
            h('tbody', lessons.map(l => h('tr', h('td', l.sort), h('td', l.title, h('br'), h('span.muted.small', l.id)), h('td', l.topic || ''), h('td', h(`span.badge.${l.status === 'draft' ? 'badge-warn' : 'badge-success'}`, l.status || 'published')),
              h('td.actions',
                button('Edit', () => go('lesson', { lessonId: l.id, tab: 'meta', draft: null }), 'btn-ghost btn-sm'),
                button('Delete', async () => {
                  if (!confirm(`Delete lesson "${l.title}"? Students lose access to it.`)) return;
                  D.catalog.lessons = D.catalog.lessons.filter(x => x !== l); await repo.deleteLesson(l.id); await saveCatalog(); flash('Lesson deleted.'); render();
                }, 'btn-ghost btn-sm'))))))) : h('p.muted.small', 'No lessons yet.'));
      })));
  }
  return wrap;
};

async function saveCatalog() {
  const errors = validateCatalog(D.catalog).filter(e => !e.includes('no lesson body'));
  await repo.saveCatalog(D.catalog);
  return errors.length ? errors : null;
}

/** Modal-less editing: replace the main area with a form, Save/Cancel. */
function editEntity(kind, value, onSave, { title } = {}) {
  const form = renderForm(ENTITY_FIELDS[kind], value, ctx());
  const errs = h('div');
  put(main, h('h2', title || `Edit ${kind}`), h('section.card', form.el, errs,
    h('div.ex-actions',
      button('Cancel', () => render(), 'btn-ghost'),
      button('Save', async () => {
        const r = form.read();
        if (r.errors.length) return put(errs, errorList(r.errors));
        const problems = await onSave(r.value);
        if (problems?.length) return put(errs, errorList(problems));
        flash('Saved.'); render();
      }, 'btn-primary'))));
}

function newLesson(unit, sort) {
  const id = `${unit.id}-l${sort}`;
  editEntity('lessonMeta', { id, unitId: unit.id, title: '', topic: '', minutes: 25, sort, status: 'draft', canDo: [] }, async v => {
    if (D.catalog.lessons.some(l => l.id === v.id)) return ['A lesson with this id exists'];
    D.catalog.lessons.push(v);
    await repo.saveLesson(blankLesson(v.id));
    await saveCatalog();
    S.section = 'lesson'; S.lessonId = v.id; S.tab = 'context'; S.draft = null;
    return null;
  }, { title: 'New lesson (starts as a draft)' });
}

// ─── Lesson editor ────────────────────────────────────────────
const TABS = [
  ['meta', 'Details'], ['context', '1 Situation'], ['input', '2 Listening'], ['reading', 'Reading (optional)'],
  ['words', '3 Words'], ['notice', '4 Notice'], ['grammar', '5 Pattern'], ['practice', '6 Practice'],
  ['pronunciation', '7 Pronunciation'], ['retrieval', '8 Recall'], ['speaking', '9 Speaking'], ['interaction', '10 Role-play'], ['json', 'JSON'],
];

VIEWS.lesson = () => {
  const wrap = h('div');
  const picker = h('select.text-input', { 'aria-label': 'Lesson', on: { change: e => { if (S.draft?.dirty && !confirm('Discard unsaved changes to this lesson?')) { e.target.value = S.lessonId; return; } go('lesson', { lessonId: e.target.value, tab: 'meta', draft: null }); } } },
    h('option', { value: '' }, 'Choose a lesson…'),
    D.catalog.lessons.map(l => h('option', { value: l.id, selected: l.id === S.lessonId }, `${l.id} — ${l.title}`)));
  add(wrap, h('h2', 'Lesson editor'), h('div.a-toolbar', picker));
  if (!S.lessonId) { add(wrap, h('p.muted', 'Pick a lesson, or create one from "Levels, units & lessons".')); return wrap; }
  const body = h('div', h('p.muted', 'Loading…'));
  add(wrap, body);
  // Work on an in-memory draft so switching tabs keeps unsaved edits.
  if (S.draft?.id === S.lessonId) put(body, lessonEditor(S.draft.lesson));
  else repo.getLesson(S.lessonId).then(lesson => { S.draft = { id: S.lessonId, lesson: structuredClone(lesson), dirty: false }; put(body, lessonEditor(S.draft.lesson)); }).catch(e => put(body, errorList([e.message])));
  return wrap;
};

function lessonEditor(lesson) {
  const meta = D.catalog.lessons.find(l => l.id === lesson.id);
  const errs = h('div');
  const editor = TAB_EDITORS[S.tab](lesson, meta);
  // Apply the current tab to the draft; false if it has errors.
  const apply = () => {
    const r = editor.read();
    if (r.errors?.length) { put(errs, errorList(r.errors)); return false; }
    if (r.meta) Object.assign(meta, r.meta);
    if (r.lesson) S.draft.lesson = r.lesson;
    S.draft.dirty = true;
    return true;
  };
  const tabs = h('div.a-stage-tabs', TABS.map(([k, label]) => h('button', { type: 'button', 'aria-current': S.tab === k ? 'true' : 'false', on: { click: () => { if (apply()) { S.tab = k; render(); } } } }, label)));
  const saveBtn = button('Save lesson', async () => {
    if (!apply()) return;
    const next = S.draft.lesson;
    await repo.saveLesson(next);
    S.draft.dirty = false;
    await saveCatalog();
    const problems = validateLesson(next, { itemIds: new Set(D.items.map(i => i.id)), videoIds: new Set(D.videos.map(v => v.id)) });
    flash(problems.length ? `Saved with ${problems.length} warning(s) — see below. Keep the lesson as a draft until they are fixed.` : 'Saved. The lesson passes all checks.', problems.length ? 'error' : 'ok');
    render();
    if (problems.length) main.append(errorList(problems));
  }, 'btn-primary');
  return h('div',
    h('p', h('strong', meta?.title || lesson.id), h('span.muted', ` · ${meta?.unitId} · ${meta?.status || 'published'}`),
      ' ', h('a', { href: `/learn/#/lesson/${lesson.id}`, target: '_blank', rel: 'noopener' }, 'Preview as a student ↗')),
    tabs, h('section.card', editor.el), errs,
    h('div.ex-actions', S.draft.dirty ? h('span.muted.small', 'Unsaved changes') : null, saveBtn));
}

const help = t => h('p.a-note', t);

const TAB_EDITORS = {
  meta(lesson, meta) {
    const f = renderForm(ENTITY_FIELDS.lessonMeta.filter(x => x.key !== 'id'), meta, ctx());
    return { el: h('div', help('Every lesson should end with can-do statements: they are what students see as progress.'), f.el), read: () => { const r = f.read(); return { meta: r.value, errors: r.errors }; } };
  },
  context(lesson) {
    const f = renderForm([
      { key: 'situation', label: 'Real-life situation', type: 'textarea', required: true },
      { key: 'situation_ar', label: 'Situation (Arabic)', type: 'textarea', dir: 'rtl' },
      { key: 'goal', label: 'Communicative goal', type: 'text', required: true },
      { key: 'goal_ar', label: 'Goal (Arabic)', type: 'text', dir: 'rtl' },
    ], lesson.context || {}, ctx());
    return { el: h('div', help('Start from a real situation the learner could be in. The higher the level, the more complex and natural.'), f.el), read: () => { const r = f.read(); return { lesson: { ...lesson, context: r.value }, errors: r.errors }; } };
  },
  input(lesson) {
    const inp = lesson.input || { script: [], gist: [], detail: [], inference: [] };
    const vids = h('select.text-input', { 'aria-label': 'Video' }, h('option', { value: '' }, 'No video — use the script with speech synthesis'),
      D.videos.map(v => h('option', { value: v.id, selected: v.id === inp.videoId }, `${v.level} · ${v.title}`)));
    const f = renderForm([
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'script', label: 'Script / transcript ("[m:ss] Speaker: text" per line; time optional, used to sync with a video)', type: 'script' },
    ], inp, ctx());
    const gist = exerciseList(inp.gist, ctx(), { skill: 'listening' });
    const detail = exerciseList(inp.detail, ctx(), { skill: 'listening' });
    const inference = exerciseList(inp.inference, ctx(), { skill: 'listening' });
    return {
      el: h('div', help('Gist first (meaning, transcript hidden), then detail, then inference at B1+. The aim is understanding the message, not translating words.'),
        h('label.field', h('span', 'Video'), vids), f.el,
        h('h3.sub', 'Gist questions (main idea)'), gist.el, h('h3.sub', 'Detail questions'), detail.el, h('h3.sub', 'Inference questions (B1+)'), inference.el),
      read: () => {
        const r = f.read(), g = gist.getValue(), d = detail.getValue(), i = inference.getValue();
        return { lesson: { ...lesson, input: { ...inp, ...r.value, videoId: vids.value || null, gist: g.value, detail: d.value, inference: i.value } }, errors: [...r.errors, ...g.errors, ...d.errors, ...i.errors] };
      },
    };
  },
  reading(lesson) {
    const rd = lesson.reading || {};
    const on = h('input', { type: 'checkbox', checked: !!lesson.reading });
    const f = renderForm([{ key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'textarea' }], rd, ctx());
    const qs = exerciseList(rd.questions || [], ctx(), { skill: 'reading' });
    return {
      el: h('div', h('label.toggle', on, ' This lesson has a reading text'), f.el, h('h3.sub', 'Questions'), qs.el),
      read: () => {
        if (!on.checked) { const { reading, ...rest } = lesson; return { lesson: rest, errors: [] }; }
        const r = f.read(), q = qs.getValue();
        return { lesson: { ...lesson, reading: { ...r.value, questions: q.value } }, errors: [...r.errors, ...q.errors] };
      },
    };
  },
  words(lesson) {
    const f = renderForm([
      { key: 'vocabulary', label: 'Items introduced in this lesson (from the conversation)', type: 'items' },
      { key: 'recycle', label: 'Items recycled from earlier lessons (use them in new sentences here)', type: 'items' },
    ], lesson, ctx());
    return { el: h('div', help('Take words and expressions from the lesson\'s own input. Prefer collocations, phrasal verbs and functional chunks. Create new items under "Vocabulary & grammar items" and add a context sentence from this lesson.'), f.el), read: () => { const r = f.read(); return { lesson: { ...lesson, vocabulary: r.value.vocabulary || [], recycle: r.value.recycle || [] }, errors: r.errors }; } };
  },
  notice(lesson) {
    let blocks = (lesson.notice || []).map(n => ({ n }));
    const wrap = h('div');
    const draw = () => {
      put(wrap, help('Quote something the learner just heard, ask a question BEFORE explaining, then explain in one or two sentences.'),
        ...blocks.map((b, i) => {
          b.form = renderForm([
            { key: 'quote', label: 'You heard: (quote from the input)', type: 'text', required: true },
            { key: 'explain', label: 'Short explanation', type: 'textarea', required: true },
            { key: 'explain_ar', label: 'Explanation (Arabic)', type: 'textarea', dir: 'rtl' },
          ], b.n, ctx());
          b.q = exerciseList(b.n.question ? [b.n.question] : [], ctx(), { skill: 'grammar' });
          return h('div.a-block', h('div.a-block-head', h('strong', `Notice ${i + 1}`), button('Delete', () => { blocks.splice(i, 1); draw(); }, 'btn-ghost btn-sm')), b.form.el, h('p.section-label', 'Question (one)'), b.q.el);
        }),
        button('Add notice', () => { blocks.push({ n: { quote: '', explain: '' } }); draw(); }, 'btn-ghost btn-sm'));
    };
    draw();
    return { el: wrap, read: () => {
      const errors = [];
      const notice = blocks.map((b, i) => { const r = b.form.read(), q = b.q.getValue(); errors.push(...r.errors.map(e => `Notice ${i + 1}: ${e}`), ...q.errors); return { ...r.value, ...(q.value[0] ? { question: q.value[0] } : {}) }; });
      return { lesson: { ...lesson, notice }, errors };
    } };
  },
  grammar(lesson) {
    const on = h('input', { type: 'checkbox', checked: !!lesson.grammar });
    const f = renderForm([
      { key: 'item', label: 'Grammar item id', type: 'items' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'context', label: 'Context (sentences from the input)', type: 'text', required: true },
      { key: 'pattern', label: 'Pattern', type: 'text', required: true },
      { key: 'examples', label: 'Examples (one per line)', type: 'list' },
      { key: 'explain', label: 'Short explanation (level-appropriate)', type: 'textarea', required: true },
      { key: 'explain_ar', label: 'Explanation (Arabic)', type: 'textarea', dir: 'rtl' },
    ], { ...(lesson.grammar || {}), item: lesson.grammar?.item ? [lesson.grammar.item] : [] }, ctx());
    return {
      el: h('div', help('Context → Example → Pattern → Short explanation → Practice → Use. Not rule → memorise → test.'), h('label.toggle', on, ' This lesson has a grammar focus'), f.el),
      read: () => {
        if (!on.checked) return { lesson: { ...lesson, grammar: null }, errors: [] };
        const r = f.read();
        return { lesson: { ...lesson, grammar: { ...r.value, item: (r.value.item || [])[0] } }, errors: r.errors };
      },
    };
  },
  practice(lesson) {
    const l = exerciseList(lesson.practice || [], ctx());
    return { el: h('div', help('Mix at least three types. Keep multiple choice to a third or less; make learners produce language.'), l.el), read: () => { const v = l.getValue(); return { lesson: { ...lesson, practice: v.value }, errors: v.errors }; } };
  },
  pronunciation(lesson) {
    const l = pronunciationList(lesson.pronunciation || []);
    return { el: h('div', help('Progress from sounds and word stress to sentence stress, connected speech and intonation, then shadowing of lines from the lesson.'), l.el), read: () => ({ lesson: { ...lesson, pronunciation: l.getValue().value }, errors: [] }) };
  },
  retrieval(lesson) {
    const l = exerciseList(lesson.retrieval || [], ctx(), { allowed: RETRIEVAL_TYPES });
    return { el: h('div', help('Recall from memory, without options: gap, recall, transformation, dictation, own sentence.'), l.el), read: () => { const v = l.getValue(); return { lesson: { ...lesson, retrieval: v.value }, errors: v.errors }; } };
  },
  speaking(lesson) {
    const sp = lesson.speaking || {};
    const c = renderForm([{ key: 'instruction', label: 'Instruction', type: 'text' }, { key: 'instruction_ar', label: 'Instruction (Arabic)', type: 'text', dir: 'rtl' }, { key: 'lines', label: 'Model lines to repeat', type: 'list' }], sp.controlled || {}, ctx());
    const g = renderForm([{ key: 'instruction', label: 'Instruction', type: 'text' }, { key: 'instruction_ar', label: 'Instruction (Arabic)', type: 'text', dir: 'rtl' }, { key: 'frame', label: 'Frame (sentence starters)', type: 'list' }, { key: 'checklist', label: 'Checklist', type: 'list' }], sp.guided || {}, ctx());
    const fr = renderForm([{ key: 'instruction', label: 'Task', type: 'textarea' }, { key: 'instruction_ar', label: 'Task (Arabic)', type: 'textarea', dir: 'rtl' }, { key: 'prepSeconds', label: 'Preparation (seconds)', type: 'number' }, { key: 'maxSeconds', label: 'Maximum speaking time (seconds)', type: 'number' }, { key: 'ideas', label: 'Ideas', type: 'list' }, { key: 'useful', label: 'Useful language', type: 'list' }, { key: 'checklist', label: 'Self-check', type: 'list' }], sp.free || {}, ctx());
    return {
      el: h('div', help('Controlled (repeat) → guided (frame) → free (own message). Speaking is practised and logged, never auto-scored.'),
        h('h3.sub', 'Controlled'), c.el, h('h3.sub', 'Guided'), g.el, h('h3.sub', 'Free'), fr.el),
      read: () => ({ lesson: { ...lesson, speaking: { controlled: c.read().value, guided: g.read().value, free: fr.read().value } }, errors: [] }),
    };
  },
  interaction(lesson) {
    const ta = h('textarea.text-input', { rows: 22 }, JSON.stringify(lesson.interaction || ROLEPLAY_TEMPLATE, null, 2));
    const out = h('div');
    const test = button('Test with the model answers', () => {
      let rp; try { rp = JSON.parse(ta.value); } catch (e) { return put(out, errorList([e.message])); }
      const errs = validateRoleplay(rp);
      if (errs.length) return put(out, errorList(errs));
      let st = roleplay.start(rp); const log = [`${rp.character || 'Character'}: ${st.log[0].text}`];
      for (let i = 0; i < 20 && !st.ended; i++) {
        const t = roleplay.turnById(rp, st.turnId);
        const r = roleplay.respond(rp, st, t.model || '');
        log.push(`Student: ${t.model || '(no model)'}`, r.hint ? `  ✗ not understood — hint: ${r.hint}` : `${rp.character || 'Character'}: ${r.reply}`);
        if (r.hint) break;
        st = r.state;
      }
      const missing = rp.goals.filter(g => !st.goalsDone.includes(g.id)).map(g => g.label);
      put(out, h('pre.a-block', { style: { whiteSpace: 'pre-wrap', fontSize: '12px' } }, log.join('\n')),
        missing.length ? errorList([`Goals not reached: ${missing.join(', ')}`]) : h('div.a-ok', st.ended ? 'The conversation completes and reaches every goal.' : 'Did not reach the end.'));
    }, 'btn-ghost btn-sm');
    return {
      el: h('div', help('A conversation with a communicative goal. Goals have patterns (regex) credited on any turn; each turn has expected replies (patterns → reply → next turn), a fallback hint, and a model answer. Test it before saving.'), ta, h('div.a-toolbar', test), out),
      read: () => { try { const rp = JSON.parse(ta.value); return { lesson: { ...lesson, interaction: rp }, errors: validateRoleplay(rp) }; } catch (e) { return { errors: [`Invalid JSON: ${e.message}`] }; } },
    };
  },
  json(lesson) {
    const ta = h('textarea.text-input', { rows: 30 }, JSON.stringify(lesson, null, 2));
    return { el: h('div', help('Advanced: the whole lesson body. Saved exactly as written, after validation.'), ta), read: () => { try { const v = JSON.parse(ta.value); if (v.id !== lesson.id) return { errors: ['Do not change the id here.'] }; return { lesson: v, errors: [] }; } catch (e) { return { errors: [`Invalid JSON: ${e.message}`] }; } } };
  },
};

// ─── Videos ───────────────────────────────────────────────────
VIEWS.videos = () => {
  const rows = D.videos.map(v => h('tr', h('td', h('span.level-code.small', v.level)), h('td', v.title, h('br'), h('a.muted.small', { href: v.url, target: '_blank', rel: 'noopener' }, v.url)), h('td', v.topic), h('td', v.duration || ''), h('td', v.difficulty ?? ''),
    h('td', v.transcript?.length ? `${v.transcript.length} lines` : '—'), h('td', (v.questions || []).length),
    h('td.actions', button('Edit', () => editVideo(v), 'btn-ghost btn-sm'), button('Delete', async () => { if (!confirm(`Delete "${v.title}"?`)) return; D.videos = D.videos.filter(x => x !== v); await repo.saveVideos(D.videos); render(); }, 'btn-ghost btn-sm'))));
  return h('div', h('h2', 'YouTube videos'),
    help('Paste a YouTube link and classify it yourself: CEFR level, topic, difficulty. Nothing is inferred from YouTube. Attach a video to a lesson in the lesson editor (Listening tab), or leave it as a standalone listening practice.'),
    h('div.a-toolbar', button('Add video', () => editVideo(null), 'btn-primary btn-sm')),
    D.videos.length ? h('div.a-wrap', h('table.a-table', h('thead', h('tr', ['Level', 'Title', 'Topic', 'Duration', 'Diff.', 'Transcript', 'Qs', ''].map(t => h('th', t)))), h('tbody', rows))) : h('p.muted', 'No videos yet.'));
};

function editVideo(v) {
  const isNew = !v;
  const value = v ? { ...v } : { level: 'A1', difficulty: 3, questions: [] };
  editEntity('video', value, async val => {
    const yid = youtubeId(val.url);
    const problems = [];
    if (!yid) problems.push('That doesn\'t look like a YouTube link.');
    if (val.duration && parseDuration(val.duration) == null) problems.push('Duration must look like 4:35');
    if (val.difficulty != null && !(val.difficulty >= 1 && val.difficulty <= 5)) problems.push('Difficulty is 1–5');
    const qErrors = (val.questions || []).flatMap((q, i) => (EXERCISE_TYPES[q.type] ? [] : [`Question ${i + 1}: unknown type`]));
    problems.push(...qErrors);
    if (problems.length) return problems;
    const rec = { ...val, youtubeId: yid, id: v?.id || `vid-${yid}` };
    if (isNew && D.videos.some(x => x.id === rec.id)) return ['This video is already in the library.'];
    if (isNew) D.videos.push(rec); else Object.assign(v, rec);
    await repo.saveVideos(D.videos);
    return null;
  }, { title: isNew ? 'Add a YouTube video' : 'Edit video' });
  add(main, help('Questions example: [{"type":"mcq","prompt":"What is the speaker\'s main point?","options":["…","…","…"],"answer":0,"kind":"gist"},{"type":"gap","prompt":"Complete","text":"She has lived here ___ 2019.","answers":["since"]}]'));
}

// ─── Items ────────────────────────────────────────────────────
VIEWS.items = () => {
  const q = h('input.text-input', { type: 'search', placeholder: 'Search items', 'aria-label': 'Search items' });
  const lv = h('select.text-input', { 'aria-label': 'Level' }, h('option', { value: '' }, 'All levels'), LEVELS.map(l => h('option', { value: l }, l)));
  const tableWrap = h('div.a-wrap');
  const usage = {};
  Promise.all(D.catalog.lessons.map(async l => { try { const b = await repo.getLesson(l.id); for (const id of [...(b.vocabulary || []), ...(b.recycle || [])]) (usage[id] ||= []).push(l.id); if (b.grammar?.item) (usage[b.grammar.item] ||= []).push(l.id); } catch { /* skip */ } })).then(draw);
  function draw() {
    const s = q.value.toLowerCase();
    const list = D.items.filter(i => (!lv.value || i.level === lv.value) && (!s || i.form.toLowerCase().includes(s) || i.id.includes(s) || i.meaning.toLowerCase().includes(s)));
    put(tableWrap, h('table.a-table', h('thead', h('tr', ['Level', 'Item', 'Kind', 'Contexts', 'Used in', ''].map(t => h('th', t)))),
      h('tbody', list.map(i => h('tr', h('td', i.level), h('td', h('strong', i.form), h('br'), h('span.muted.small', `${i.id} — ${i.meaning}`)), h('td', i.kind),
        h('td', String(i.contexts?.length || 0)), h('td.small', (usage[i.id] || []).join(', ') || h('span.muted', 'not used')),
        h('td.actions', button('Edit', () => editItem(i), 'btn-ghost btn-sm'),
          button('Delete', async () => {
            if (usage[i.id]?.length) return alert(`Used in ${usage[i.id].join(', ')}. Remove it from those lessons first.`);
            if (!confirm(`Delete ${i.id}?`)) return;
            D.items = D.items.filter(x => x !== i); await repo.saveItems(D.items); render();
          }, 'btn-ghost btn-sm')))))));
  }
  q.addEventListener('input', draw); lv.addEventListener('change', draw);
  draw();
  return h('div', h('h2', 'Vocabulary & grammar items'),
    help('An item is what the review system schedules. Give each one several context sentences from DIFFERENT lessons and levels — reviews pick a sentence the learner hasn\'t answered yet, so recycling happens automatically.'),
    h('div.a-toolbar', q, lv, h('span.spacer'), button('Add item', () => editItem(null), 'btn-primary btn-sm')), tableWrap);
};

function editItem(item) {
  const isNew = !item;
  editEntity('item', item ? { ...item } : { kind: 'collocation', level: 'A1', contexts: [] }, async v => {
    if (isNew && D.items.some(x => x.id === v.id)) return ['An item with this id exists'];
    const problems = validateItem(v);
    if (problems.length) return problems;
    if (isNew) D.items.push(v); else Object.assign(item, v);
    await repo.saveItems(D.items);
    return null;
  }, { title: isNew ? 'Add an item' : `Edit ${item.id}` });
  add(main, help('Contexts: one per line — "sentence | the words to blank out | lesson-id". Example: "Have you made a decision yet? | made a decision | b1-u1-l1". Patterns: regex that recognises the item in learners\' free sentences, e.g. ma(ke|de|kes) (a|the) decision.'));
}

// ─── Assessments ──────────────────────────────────────────────
VIEWS.assessments = () => {
  const wrap = h('div', h('h2', 'Placement & level checks'));
  const which = h('select.text-input', { 'aria-label': 'Assessment' },
    h('option', { value: 'placement' }, 'Placement test bank'), LEVELS.map(l => h('option', { value: l, selected: S.assessment === l }, `${l} level check`)));
  which.value = S.assessment || 'placement';
  which.addEventListener('change', () => { S.assessment = which.value; render(); });
  add(wrap, h('div.a-toolbar', which));
  const body = h('div');
  add(wrap, body);
  if (which.value === 'placement') placementEditor(body); else levelCheckEditor(body, which.value);
  return wrap;
};

function placementEditor(body) {
  const skill = h('select.text-input', { 'aria-label': 'Skill' }, ['grammar', 'vocabulary', 'reading', 'listening'].map(s => h('option', { value: s, selected: s === S.pSkill }, s)));
  const level = h('select.text-input', { 'aria-label': 'Level' }, TESTED.map(l => h('option', { value: l, selected: l === S.pLevel }, l)));
  skill.value = S.pSkill || 'grammar'; level.value = S.pLevel || 'A1';
  skill.addEventListener('change', () => { S.pSkill = skill.value; render(); });
  level.addEventListener('change', () => { S.pLevel = level.value; render(); });
  const blk = D.placement.sections[skill.value]?.[level.value] || { items: [] };
  const stim = skill.value === 'reading'
    ? renderForm([{ key: 'text', label: 'Reading text', type: 'textarea' }], blk, ctx())
    : skill.value === 'listening' ? renderForm([{ key: 'script', label: 'Listening script', type: 'script' }], blk, ctx()) : null;
  const items = exerciseList(blk.items, ctx(), { skill: skill.value });
  const errs = h('div');
  put(body, help('Each skill × level block needs exactly 3 items: the staircase moves up after 2 of 3. Speaking is not part of placement.'),
    h('div.a-toolbar', skill, level), stim?.el, items.el, errs,
    h('div.ex-actions', button('Save block', async () => {
      const v = items.getValue();
      const extra = stim ? stim.read().value : {};
      const problems = [...v.errors, ...(v.value.length !== 3 ? ['Use exactly 3 items per block.'] : [])];
      if (problems.length) return put(errs, errorList(problems));
      D.placement.sections[skill.value] ||= {};
      D.placement.sections[skill.value][level.value] = { ...extra, items: v.value };
      await repo.savePlacement(D.placement); flash('Placement block saved.'); render();
    }, 'btn-primary')));
}

function levelCheckEditor(body, lvl) {
  const a = D.assessments[lvl] || { title: `${lvl} check`, sections: ['listening', 'reading', 'vocabulary', 'grammar'].map(skill => ({ skill, items: [] })), speaking: { instruction: '', checklist: [] } };
  const parts = a.sections.map(sec => ({
    sec,
    stim: sec.skill === 'reading' ? renderForm([{ key: 'text', label: 'Reading text', type: 'textarea' }], sec, ctx())
      : sec.skill === 'listening' ? renderForm([{ key: 'script', label: 'Listening script', type: 'script' }], sec, ctx()) : null,
    items: exerciseList(sec.items, ctx(), { skill: sec.skill }),
  }));
  const sp = renderForm([{ key: 'instruction', label: 'Speaking task (recorded, not scored)', type: 'textarea' }, { key: 'checklist', label: 'Self-check', type: 'list' }], a.speaking || {}, ctx());
  const errs = h('div');
  put(body, help('Four sections, each must reach 70% on its own. Mix recognition and typed recall; recycle items from the level\'s lessons.'),
    ...parts.map(p => h('section.card', h('h3', p.sec.skill), p.stim?.el, p.items.el)),
    h('section.card', h('h3', 'Speaking'), sp.el), errs,
    h('div.ex-actions', button('Save level check', async () => {
      const problems = [];
      const sections = parts.map(p => { const v = p.items.getValue(); problems.push(...v.errors); if (!v.value.length) problems.push(`${p.sec.skill}: add at least one question`); return { ...p.sec, ...(p.stim ? p.stim.read().value : {}), items: v.value }; });
      if (problems.length) return put(errs, errorList(problems));
      D.assessments[lvl] = { ...a, sections, speaking: sp.read().value };
      await repo.saveAssessments(D.assessments); flash(`${lvl} level check saved.`); render();
    }, 'btn-primary')));
}

// ─── Review schedules ─────────────────────────────────────────
VIEWS.schedules = () => h('div', h('h2', 'Review schedules'),
  help('Push chosen items into students\' daily review from a date — e.g. before an exam, or to recycle a unit. "seen" = only students who have met the item; "all" = everyone.'),
  h('div.a-toolbar', button('Add schedule', () => editSchedule(null), 'btn-primary btn-sm')),
  D.schedules.length ? h('table.a-table', h('thead', h('tr', ['Title', 'Items', 'From', 'Who', ''].map(t => h('th', t)))),
    h('tbody', D.schedules.map(sc => h('tr', h('td', sc.title), h('td.small', sc.items.join(', ')), h('td', sc.due), h('td', sc.audience || 'seen'),
      h('td.actions', button('Edit', () => editSchedule(sc), 'btn-ghost btn-sm'), button('Delete', async () => { D.schedules = D.schedules.filter(x => x !== sc); await repo.saveSchedules(D.schedules); render(); }, 'btn-ghost btn-sm'))))))
    : h('p.muted', 'No schedules.'));

function editSchedule(sc) {
  editEntity('schedule', sc ? { ...sc } : { audience: 'seen', due: new Date().toISOString().slice(0, 10) }, async v => {
    if (sc) Object.assign(sc, v); else D.schedules.push({ id: `sch-${Date.now().toString(36)}`, ...v });
    await repo.saveSchedules(D.schedules);
    return null;
  }, { title: sc ? 'Edit schedule' : 'New review schedule' });
}

// ─── Student progress ─────────────────────────────────────────
const STUDENTS_KEY = 'learn.admin.students.v1';
function loadStudents() { try { return JSON.parse(localStorage.getItem(STUDENTS_KEY)) || []; } catch { return []; } }

VIEWS.students = () => {
  const students = loadStudents();
  try { const own = JSON.parse(localStorage.getItem('learn.progress.v1')); if (own?.profile) students.unshift({ label: 'This browser\'s learner', data: own }); } catch { /* none */ }
  const file = h('input', { type: 'file', accept: '.json', multiple: true, hidden: true, on: { change: async e => {
    const list = loadStudents();
    for (const f of e.target.files) {
      try { const data = JSON.parse(await f.text()); if (!data.profile) throw new Error('not a progress file'); list.push({ label: data.profile.name || f.name, data }); }
      catch (err) { alert(`${f.name}: ${err.message}`); }
    }
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(list)); render();
  } } });
  return h('div', h('h2', 'Student progress'),
    help('In this static build, each student\'s progress lives in their own browser. Students download it from Settings → "Download my progress"; import the files here. With the server schema (db/schema.sql) this page reads every student directly.'),
    h('div.a-toolbar', button('Import progress files', () => file.click(), 'btn-primary btn-sm'), file,
      students.length > 1 ? button('Clear imported', () => { localStorage.removeItem(STUDENTS_KEY); render(); }, 'btn-ghost btn-sm') : null),
    students.length ? students.map(studentCard) : h('p.muted', 'No progress data yet.'));
};

function studentCard({ label, data }) {
  const states = Object.values(data.itemStates || {});
  const now = Date.now();
  const prof = skillProfile({ attempts: data.attempts || [], states, lessonProgress: data.lessonProgress || {}, speakingLogs: data.speakingLogs || [], catalog: D.catalog }, now);
  const can = canDoNow(D.catalog, data.lessonProgress || {});
  const st = stageCounts(states);
  const pct = s => (s?.score == null ? '—' : `${Math.round(s.score * 100)}%`);
  const lessons = Object.entries(data.lessonProgress || {});
  return h('section.card',
    h('h3', label, h('span.muted', ` · ${data.profile.currentLevel} (unlocked ${data.profile.unlockedLevel})`)),
    h('div.stat-row',
      stat('Listening', `${pct(prof.listening)} (${prof.listening.n})`), stat('Grammar', `${pct(prof.grammar)} (${prof.grammar.n})`),
      stat('Vocabulary retention', `${pct(prof.vocabulary)} · ${st.learning} learning / ${st.review} review / ${st.mastered} mastered`),
      stat('Speaking', `${prof.speaking.controlled}/${prof.speaking.guided}/${prof.speaking.free} tasks · ${prof.speaking.minutes} min`),
      stat('Role-play goals', `${prof.functional.achieved}/${prof.functional.attempted}`),
      stat('Due reviews', states.filter(s => s.stage !== 'new' && s.due <= now).length)),
    lessons.length ? h('table.a-table', h('thead', h('tr', ['Lesson', 'Status', 'Score', 'Weak stages'].map(t => h('th', t)))),
      h('tbody', lessons.map(([id, p]) => h('tr', h('td', id), h('td', p.status), h('td', p.overall != null ? `${Math.round(p.overall * 100)}%` : '—'), h('td', (p.weak || []).join(', ')))))) : null,
    can.length ? h('p.small', h('strong', 'Can do: '), can.flatMap(g => g.items.map(i => i.text)).join(' · ')) : null,
    data.profile.placement ? h('p.small.muted', `Placement: ${data.profile.placement.overall} (${Object.entries(data.profile.placement.bySkill).map(([k, v]) => `${k} ${v}`).join(', ')})`) : null);
}

// ─── Start ────────────────────────────────────────────────────
(async () => {
  document.documentElement.dataset.theme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  try { await load(); render(); }
  catch (e) { put(main, errorList([`Could not load content: ${e.message}`])); }
})();

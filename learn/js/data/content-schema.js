// ════════════════════════════════════════════════════════════
// Content schema — ONE definition used for:
//   • the admin panel's generated forms (field lists per type)
//   • the line formats admins type in (codecs below)
//   • validation, in the admin panel and in the test suite
// ════════════════════════════════════════════════════════════
import { makeCloze } from '../engine/text.js';

export const LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];
export const SKILLS = ['listening', 'reading', 'vocabulary', 'grammar', 'pronunciation', 'functional'];
export const ITEM_KINDS = ['word', 'collocation', 'phrasal-verb', 'expression', 'grammar'];

/*
 Field types understood by the admin form builder:
   text · textarea · number · select(options) · list (one per line)
   pairs ("left => right" per line) · items (item ids, comma-separated)
   script ("[m:ss] Speaker: text" per line) · json · bool
*/
const common = [
  { key: 'prompt', label: 'Instruction / question', type: 'text', required: true },
  { key: 'prompt_ar', label: 'Instruction (Arabic support, optional)', type: 'text', dir: 'rtl' },
  { key: 'skill', label: 'Skill', type: 'select', options: SKILLS },
  { key: 'items', label: 'Learning items practised', type: 'items' },
];

export const EXERCISE_TYPES = {
  mcq: { label: 'Multiple choice (use sparingly)', fields: [
    ...common,
    { key: 'sentence', label: 'Context sentence (optional)', type: 'text' },
    { key: 'options', label: 'Options (one per line)', type: 'list', required: true },
    { key: 'answer', label: 'Correct option number (0 = first)', type: 'number', required: true },
    { key: 'kind', label: 'Listening question kind', type: 'select', options: ['', 'gist', 'detail', 'inference'] },
    { key: 'explain', label: 'Why each wrong option is wrong ({"1":"…"})', type: 'json' },
  ] },
  gap: { label: 'Gap fill (typed)', fields: [
    ...common,
    { key: 'text', label: 'Sentence with ___ for the gap', type: 'text', required: true },
    { key: 'answers', label: 'Accepted answers (one per line)', type: 'list', required: true },
    { key: 'hint', label: 'Hint', type: 'text' },
    { key: 'errors', label: 'Anticipated errors [{"match":"regex","why":"…"}]', type: 'json' },
  ] },
  recall: { label: 'Recall (typed, no options)', fields: [
    ...common,
    { key: 'answers', label: 'Accepted answers (one per line)', type: 'list', required: true },
    { key: 'hint', label: 'Hint', type: 'text' },
  ] },
  transform: { label: 'Transformation', fields: [
    ...common,
    { key: 'source', label: 'Sentence to transform', type: 'text', required: true },
    { key: 'answers', label: 'Accepted answers', type: 'list', required: true },
    { key: 'why', label: 'Explanation', type: 'text' },
  ] },
  correct: { label: 'Error correction', fields: [
    ...common,
    { key: 'sentence', label: 'Sentence with an error', type: 'text', required: true },
    { key: 'answers', label: 'Accepted corrections', type: 'list', required: true },
    { key: 'why', label: 'Explanation', type: 'text' },
    { key: 'why_ar', label: 'Explanation (Arabic)', type: 'text', dir: 'rtl' },
  ] },
  order: { label: 'Build the sentence', fields: [
    ...common,
    { key: 'tokens', label: 'Word tiles (one per line, any order)', type: 'list', required: true },
    { key: 'answers', label: 'Accepted sentences', type: 'list', required: true },
  ] },
  match: { label: 'Matching', fields: [
    ...common,
    { key: 'pairs', label: 'Pairs ("left => right" per line)', type: 'pairs', required: true },
  ] },
  dictation: { label: 'Dictation', fields: [
    ...common,
    { key: 'text', label: 'Text the learner hears and writes', type: 'text', required: true },
  ] },
  produce: { label: 'Own sentence (production)', fields: [
    ...common,
    { key: 'target', label: 'Target patterns (regex, one per line)', type: 'list', required: true },
    { key: 'targetLabel', label: 'Target shown to learner', type: 'text' },
    { key: 'sample', label: 'Model answer', type: 'text' },
    { key: 'minWords', label: 'Minimum words', type: 'number' },
  ] },
};

/** Retrieval must make the learner produce: no multiple choice there. */
export const RETRIEVAL_TYPES = ['recall', 'gap', 'produce', 'transform', 'dictation'];

export const PRONUNCIATION_TYPES = {
  'minimal-pair': { label: 'Minimal pairs (listen & choose)', lines: 'pairs', help: 'One pair per line: ship / sheep' },
  stress: { label: 'Word stress', lines: 'stress', help: 'Hyphenate syllables, capitalise the stressed one: ho-TEL' },
  'sound-choice': { label: 'Choose the sound', lines: 'sounds', help: 'Options line first: /s/ | /z/ | /ɪz/ — then word: /sound/ per line' },
  'sentence-stress': { label: 'Sentence stress', lines: 'stars', help: 'Mark stressed words with *: *Where* are you *from*?' },
  intonation: { label: 'Intonation (rise / fall)', lines: 'tone', help: 'Sentence | rise  or  Sentence | fall' },
  connected: { label: 'Connected speech (listen & write)', lines: 'notes', help: 'Sentence | how it sounds' },
  shadow: { label: 'Shadowing (listen, repeat, compare)', lines: 'plain', help: 'One sentence per line' },
};

export const ENTITY_FIELDS = {
  level: [
    { key: 'code', label: 'Code', type: 'select', options: LEVELS, required: true },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'summary', label: 'Summary', type: 'textarea' },
    { key: 'summary_ar', label: 'Summary (Arabic)', type: 'textarea', dir: 'rtl' },
    { key: 'sort', label: 'Order', type: 'number' },
  ],
  unit: [
    { key: 'id', label: 'ID (e.g. b1-u3)', type: 'text', required: true },
    { key: 'level', label: 'CEFR level', type: 'select', options: LEVELS, required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'summary', label: 'Summary', type: 'textarea' },
    { key: 'sort', label: 'Order', type: 'number' },
  ],
  lessonMeta: [
    { key: 'id', label: 'ID (e.g. b1-u3-l1)', type: 'text', required: true },
    { key: 'unitId', label: 'Unit', type: 'unit', required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'topic', label: 'Real-life topic', type: 'text' },
    { key: 'minutes', label: 'Minutes', type: 'number' },
    { key: 'sort', label: 'Order in unit', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['published', 'draft'] },
    { key: 'canDo', label: 'Can-do statements (one per line)', type: 'list' },
  ],
  video: [
    { key: 'url', label: 'YouTube URL', type: 'text', required: true },
    { key: 'title', label: 'Video title', type: 'text', required: true },
    { key: 'level', label: 'CEFR level (set manually)', type: 'select', options: LEVELS, required: true },
    { key: 'topic', label: 'Topic', type: 'text', required: true },
    { key: 'duration', label: 'Duration (m:ss)', type: 'text' },
    { key: 'difficulty', label: 'Difficulty within level (1–5)', type: 'number' },
    { key: 'transcript', label: 'Transcript ("[m:ss] Speaker: text" per line, optional)', type: 'script' },
    { key: 'vocabulary', label: 'Vocabulary (item ids)', type: 'items' },
    { key: 'expressions', label: 'Target expressions (item ids)', type: 'items' },
    { key: 'grammar', label: 'Grammar focus (item ids)', type: 'items' },
    { key: 'questions', label: 'Comprehension questions (JSON list of exercises)', type: 'json' },
  ],
  item: [
    { key: 'id', label: 'ID (e.g. make-a-decision)', type: 'text', required: true },
    { key: 'kind', label: 'Kind', type: 'select', options: ITEM_KINDS, required: true },
    { key: 'level', label: 'CEFR level', type: 'select', options: LEVELS, required: true },
    { key: 'form', label: 'Word / expression / pattern', type: 'text', required: true },
    { key: 'meaning', label: 'Meaning (simple English)', type: 'text', required: true },
    { key: 'meaning_ar', label: 'Meaning (Arabic)', type: 'text', dir: 'rtl' },
    { key: 'example', label: 'Example', type: 'text' },
    { key: 'note', label: 'Usage note', type: 'text' },
    { key: 'audio', label: 'Audio URL (optional — speech synthesis otherwise)', type: 'text' },
    { key: 'match', label: 'Recognition patterns (regex, one per line)', type: 'list' },
    { key: 'produce', label: 'Own-sentence prompt for reviews', type: 'text' },
    { key: 'contexts', label: 'Contexts for recycling ("sentence | cloze | lesson-id" per line)', type: 'contexts' },
  ],
  schedule: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'items', label: 'Items to review (ids)', type: 'items', required: true },
    { key: 'due', label: 'Due date', type: 'date', required: true },
    { key: 'audience', label: 'Who', type: 'select', options: ['seen', 'all'] },
  ],
};

// ─── Line-format codecs (admin ⇄ JSON) ─────────────────────────────────
export const codecs = {
  list: {
    parse: s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean),
    format: a => (a || []).join('\n'),
  },
  pairs: {
    parse: s => codecs.list.parse(s).map(l => l.split('=>').map(x => x.trim())).filter(p => p.length === 2 && p[0] && p[1]),
    format: a => (a || []).map(p => `${p[0]} => ${p[1]}`).join('\n'),
  },
  items: {
    parse: s => String(s || '').split(/[,\n]/).map(x => x.trim()).filter(Boolean),
    format: a => (a || []).join(', '),
  },
  script: {
    parse: s => codecs.list.parse(s).map(l => {
      const m = l.match(/^\[(\d+):(\d{2})\]\s*(.*)$/);
      const time = m ? Number(m[1]) * 60 + Number(m[2]) : null;
      const rest = m ? m[3] : l;
      const i = rest.indexOf(':');
      const line = i > 0 && i < 30 ? { s: rest.slice(0, i).trim(), t: rest.slice(i + 1).trim() } : { s: '', t: rest.trim() };
      if (time != null) line.time = time;
      return line;
    }),
    format: a => (a || []).map(l => `${l.time != null ? `[${Math.floor(l.time / 60)}:${String(l.time % 60).padStart(2, '0')}] ` : ''}${l.s ? l.s + ': ' : ''}${l.t}`).join('\n'),
  },
  contexts: {
    parse: s => codecs.list.parse(s).map((l, i) => {
      const [sentence, cloze, lesson] = l.split('|').map(x => x.trim());
      const c = { id: `c${i + 1}`, sentence, cloze: cloze || '' };
      if (lesson) c.lesson = lesson;
      return c;
    }),
    format: a => (a || []).map(c => [c.sentence, c.cloze, c.lesson].filter(x => x != null && x !== '').join(' | ')).join('\n'),
  },
  // Pronunciation line formats
  pron: {
    'minimal-pair': {
      parse: s => ({ pairs: codecs.list.parse(s).map(l => l.split('/').map(x => x.trim())).filter(p => p.length === 2) }),
      format: b => (b.pairs || []).map(p => p.join(' / ')).join('\n'),
    },
    stress: {
      parse: s => ({ words: codecs.list.parse(s).map(l => {
        const syl = l.split('-');
        const stress = Math.max(0, syl.findIndex(x => x === x.toUpperCase() && /[A-Z]/.test(x)));
        return { word: syl.join('').toLowerCase(), syllables: syl.map(x => x.toLowerCase()), stress };
      }) }),
      format: b => (b.words || []).map(w => w.syllables.map((x, i) => i === w.stress ? x.toUpperCase() : x).join('-')).join('\n'),
    },
    'sound-choice': {
      parse: s => {
        const lines = codecs.list.parse(s);
        const options = (lines.shift() || '').split('|').map(x => x.trim()).filter(Boolean);
        return { options, words: lines.map(l => { const [word, snd] = l.split(':').map(x => x.trim()); return { word, answer: Math.max(0, options.indexOf(snd)) }; }) };
      },
      format: b => [(b.options || []).join(' | '), ...(b.words || []).map(w => `${w.word}: ${b.options[w.answer]}`)].join('\n'),
    },
    'sentence-stress': {
      parse: s => ({ sentences: codecs.list.parse(s).map(l => {
        const toks = l.split(/\s+/);
        return { text: toks.map(t => t.replace(/\*/g, '')).join(' '), stressed: toks.map((t, i) => (t.includes('*') ? i : -1)).filter(i => i >= 0) };
      }) }),
      format: b => (b.sentences || []).map(x => x.text.split(/\s+/).map((t, i) => (x.stressed.includes(i) ? `*${t}*` : t)).join(' ')).join('\n'),
    },
    intonation: {
      parse: s => ({ items: codecs.list.parse(s).map(l => { const [text, p] = l.split('|').map(x => x.trim()); return { text, pattern: p === 'rise' ? 'rise' : 'fall' }; }) }),
      format: b => (b.items || []).map(i => `${i.text} | ${i.pattern}`).join('\n'),
    },
    connected: {
      parse: s => ({ items: codecs.list.parse(s).map(l => { const [text, note] = l.split('|').map(x => x.trim()); return { text, note: note || '' }; }) }),
      format: b => (b.items || []).map(i => `${i.text}${i.note ? ' | ' + i.note : ''}`).join('\n'),
    },
    shadow: {
      parse: s => ({ lines: codecs.list.parse(s) }),
      format: b => (b.lines || []).join('\n'),
    },
  },
};

/** Extract the 11-character id from any common YouTube URL form. */
export function youtubeId(url) {
  const s = String(url || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function parseDuration(s) {
  const m = String(s || '').match(/^(\d+):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// ─── Validation ─────────────────────────────────────────────────────────
function checkRegexes(list, where, errors) {
  for (const p of list || []) {
    try { new RegExp(p, 'i'); } catch (e) { errors.push(`${where}: invalid pattern ${p} (${e.message})`); }
  }
}

export function validateExercise(ex, where, ctx = {}) {
  const errors = [];
  const w = `${where} ${ex?.id || ''}`.trim();
  if (!ex || !EXERCISE_TYPES[ex.type]) return [`${w}: unknown exercise type "${ex?.type}"`];
  for (const f of EXERCISE_TYPES[ex.type].fields) {
    if (f.required && (ex[f.key] == null || ex[f.key] === '' || (Array.isArray(ex[f.key]) && !ex[f.key].length))) {
      if (!(f.key === 'prompt' && ex.type === 'dictation')) errors.push(`${w}: missing ${f.key}`);
    }
  }
  if (ex.type === 'mcq' && !(ex.answer >= 0 && ex.answer < (ex.options || []).length)) errors.push(`${w}: answer index out of range`);
  if (ex.type === 'gap' && !String(ex.text || '').includes('___')) errors.push(`${w}: gap text needs ___`);
  if (ex.type === 'order') {
    const joined = (ex.tokens || []).map(t => t.toLowerCase()).sort().join(' ');
    const ok = (ex.answers || []).some(a => a.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean).sort().join(' ') === joined.split(' ').sort().join(' '));
    if (!ok) errors.push(`${w}: tiles don't build any accepted answer`);
  }
  if (ex.type === 'produce') checkRegexes(ex.target, w, errors);
  for (const e of ex.errors || []) checkRegexes([e.match], w, errors);
  if (ctx.itemIds) for (const id of ex.items || []) if (!ctx.itemIds.has(id)) errors.push(`${w}: unknown item "${id}"`);
  return errors;
}

export function validateItem(item) {
  const errors = [];
  const w = `item ${item.id}`;
  for (const f of ENTITY_FIELDS.item) if (f.required && !item[f.key]) errors.push(`${w}: missing ${f.key}`);
  if (!ITEM_KINDS.includes(item.kind)) errors.push(`${w}: bad kind`);
  if (!LEVELS.includes(item.level)) errors.push(`${w}: bad level`);
  checkRegexes(item.match, w, errors);
  const ids = new Set();
  for (const c of item.contexts || []) {
    if (ids.has(c.id)) errors.push(`${w}: duplicate context id ${c.id}`);
    ids.add(c.id);
    if (!makeCloze(c.sentence, c.cloze).found) errors.push(`${w}: cloze "${c.cloze}" not in "${c.sentence}"`);
  }
  return errors;
}

/** Validate a lesson body against the item bank and video library. */
export function validateLesson(lesson, { itemIds, videoIds } = {}) {
  const errors = [];
  const w = `lesson ${lesson.id}`;
  const ctx = { itemIds };
  const exList = (list, where) => (list || []).forEach(ex => errors.push(...validateExercise(ex, `${w} ${where}`, ctx)));

  if (!lesson.context?.situation) errors.push(`${w}: context.situation is required (every lesson starts from a real situation)`);
  if (!lesson.input) errors.push(`${w}: input (listening) is required`);
  if (lesson.input) {
    if (!lesson.input.script?.length && !lesson.input.videoId) errors.push(`${w}: input needs a script or a video`);
    if (lesson.input.videoId && videoIds && !videoIds.has(lesson.input.videoId)) errors.push(`${w}: unknown video ${lesson.input.videoId}`);
    if (!lesson.input.gist?.length) errors.push(`${w}: at least one gist question (meaning before detail)`);
    exList(lesson.input.gist, 'gist'); exList(lesson.input.detail, 'detail'); exList(lesson.input.inference, 'inference');
  }
  if (lesson.reading) exList(lesson.reading.questions, 'reading');
  for (const id of [...(lesson.vocabulary || []), ...(lesson.recycle || [])]) if (itemIds && !itemIds.has(id)) errors.push(`${w}: unknown item ${id}`);
  (lesson.notice || []).forEach((n, i) => {
    if (!n.quote) errors.push(`${w} notice ${i}: quote from the input is required`);
    if (!n.explain) errors.push(`${w} notice ${i}: short explanation required`);
    if (n.question) errors.push(...validateExercise(n.question, `${w} notice`, ctx));
  });
  if (lesson.grammar) {
    if (itemIds && lesson.grammar.item && !itemIds.has(lesson.grammar.item)) errors.push(`${w}: unknown grammar item ${lesson.grammar.item}`);
    for (const k of ['context', 'pattern', 'explain']) if (!lesson.grammar[k]) errors.push(`${w}: grammar.${k} required`);
  }
  exList(lesson.practice, 'practice');
  const types = new Set((lesson.practice || []).map(e => e.type));
  if ((lesson.practice || []).length >= 3 && types.size < 3) errors.push(`${w}: practice should mix at least 3 exercise types`);
  if ((lesson.practice || []).filter(e => e.type === 'mcq').length > Math.ceil((lesson.practice || []).length / 3)) errors.push(`${w}: too much multiple choice in practice`);
  exList(lesson.retrieval, 'retrieval');
  for (const ex of lesson.retrieval || []) if (!RETRIEVAL_TYPES.includes(ex.type)) errors.push(`${w} retrieval ${ex.id}: retrieval must be ${RETRIEVAL_TYPES.join('/')}, not ${ex.type}`);
  for (const p of lesson.pronunciation || []) {
    if (!PRONUNCIATION_TYPES[p.type]) errors.push(`${w}: unknown pronunciation type ${p.type}`);
    if (p.type === 'sentence-stress') for (const s of p.sentences || []) {
      const n = s.text.split(/\s+/).length;
      if (s.stressed.some(i => i < 0 || i >= n)) errors.push(`${w} ${p.id}: stress index out of range in "${s.text}"`);
    }
    if (p.type === 'stress') for (const x of p.words || []) if (x.syllables.join('') !== x.word) errors.push(`${w} ${p.id}: syllables don't spell ${x.word}`);
  }
  if (lesson.speaking) for (const k of ['controlled', 'guided', 'free']) if (!lesson.speaking[k]) errors.push(`${w}: speaking.${k} missing (controlled → guided → free)`);
  if (lesson.interaction) errors.push(...validateRoleplay(lesson.interaction, `${w} interaction`));
  return errors;
}

export function validateRoleplay(rp, w = 'roleplay') {
  const errors = [];
  if (!rp.goals?.length) errors.push(`${w}: needs communicative goals`);
  const ids = new Set((rp.turns || []).map(t => t.id));
  if (!ids.size) errors.push(`${w}: needs turns`);
  if (rp.start && !ids.has(rp.start)) errors.push(`${w}: start turn ${rp.start} missing`);
  for (const g of rp.goals || []) checkRegexes(g.patterns, `${w} goal ${g.id}`, errors);
  for (const t of rp.turns || []) {
    for (const e of t.expect || []) {
      checkRegexes(e.patterns, `${w} ${t.id}`, errors);
      if (e.next && e.next !== 'end' && !ids.has(e.next)) errors.push(`${w} ${t.id}: next turn ${e.next} missing`);
    }
  }
  return errors;
}

export function validateCatalog(catalog, lessonIds) {
  const errors = [];
  const units = new Set(catalog.units.map(u => u.id));
  for (const u of catalog.units) if (!LEVELS.includes(u.level)) errors.push(`unit ${u.id}: bad level`);
  for (const l of catalog.lessons) {
    if (!units.has(l.unitId)) errors.push(`lesson ${l.id}: unknown unit ${l.unitId}`);
    if (lessonIds && !lessonIds.has(l.id)) errors.push(`lesson ${l.id}: no lesson body`);
    if (!l.canDo?.length) errors.push(`lesson ${l.id}: add can-do statements (progress is shown as can-dos)`);
  }
  return errors;
}

/** Empty skeletons the admin panel starts from. */
export function blankExercise(type) {
  const base = { id: `ex-${Date.now().toString(36)}`, type, prompt: '', skill: 'vocabulary', items: [] };
  if (type === 'mcq') return { ...base, options: ['', '', ''], answer: 0 };
  if (type === 'gap') return { ...base, text: '___', answers: [] };
  if (type === 'order') return { ...base, tokens: [], answers: [] };
  if (type === 'match') return { ...base, pairs: [] };
  if (type === 'dictation') return { ...base, skill: 'listening', text: '' };
  if (type === 'produce') return { ...base, target: [], minWords: 5 };
  if (type === 'correct') return { ...base, skill: 'grammar', sentence: '', answers: [] };
  if (type === 'transform') return { ...base, skill: 'grammar', source: '', answers: [] };
  return { ...base, answers: [] };
}

export function blankLesson(id) {
  return {
    id,
    context: { situation: '', situation_ar: '', goal: '', goal_ar: '' },
    input: { videoId: null, title: '', script: [], gist: [], detail: [], inference: [] },
    vocabulary: [], recycle: [], notice: [],
    grammar: null,
    practice: [], pronunciation: [], retrieval: [],
    speaking: {
      controlled: { instruction: 'Listen and repeat.', lines: [] },
      guided: { instruction: '', frame: [], checklist: [] },
      free: { instruction: '', prepSeconds: 30, maxSeconds: 60, checklist: [], useful: [] },
    },
    interaction: null,
  };
}

export const ROLEPLAY_TEMPLATE = {
  setting: '', studentRole: '', characterRole: '', character: '',
  goals: [{ id: 'goal1', label: 'Describe the communicative goal', patterns: ['regex'] }],
  start: 't1',
  turns: [{ id: 't1', say: 'What the character says first', expect: [{ patterns: ['regex'], reply: 'Character reply', next: 'end' }], fallback: { reply: 'Sorry?', hint: 'Try: …' }, model: 'A model answer' }],
  useful: [],
};

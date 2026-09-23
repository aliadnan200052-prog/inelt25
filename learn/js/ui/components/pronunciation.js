// Pronunciation activities, from perception to production:
// sounds → word stress → sentence stress → connected speech →
// intonation → shadowing. Perception tasks are scored; production
// (shadowing) is logged as practice.
import { h, icon, button, ar, add, put } from '../dom.js';
import { speak } from '../speech.js';
import { shuffle, wordDiff } from '../../engine/text.js';
import { shadowing } from './speaking.js';

/**
 * renderPronunciation(block, { app, score(value, meta), logShadow(seconds), onDone })
 */
export function renderPronunciation(block, ctx) {
  const { app } = ctx;
  const el = h('div.pron');
  add(el, h('p.section-label', typeLabel(block.type)), h('h3', block.title || ''), block.tip ? h('p.tip', block.tip) : null, ar(block.tip_ar, app));
  const body = (RENDER[block.type] || (() => h('p', 'Unknown activity')))(block, ctx);
  add(el, body);
  return el;
}

function typeLabel(t) {
  return { 'minimal-pair': 'Sounds', stress: 'Word stress', 'sound-choice': 'Sounds', 'sentence-stress': 'Sentence stress', connected: 'Connected speech', intonation: 'Intonation', shadow: 'Shadowing' }[t] || 'Pronunciation';
}

const rate = app => app.progress.profile.speechRate || 0.95;

/** Run a list of small perception questions one by one. */
function sequence(list, renderOne, onDone) {
  const wrap = h('div.seq');
  let i = 0;
  const next = () => {
    if (i >= list.length) { put(wrap, h('p.muted', 'Done.')); onDone?.(); return; }
    const item = list[i++];
    put(wrap, h('p.muted.small', `${i} of ${list.length}`), renderOne(item, next));
  };
  next();
  return wrap;
}

function choice(options, correctIdx, onAnswer, labels) {
  let done = false;
  const btns = options.map((o, k) => h('button.option.inline', {
    type: 'button',
    on: { click: () => {
      if (done) return;
      done = true;
      btns.forEach((b, j) => { b.disabled = true; if (j === correctIdx) b.classList.add('ok'); else if (j === k) b.classList.add('bad'); });
      onAnswer(k === correctIdx);
    } },
  }, labels ? labels[k] : o));
  return h('div.options.row', btns);
}

const RENDER = {
  'minimal-pair'(b, { app, score, onDone }) {
    const items = shuffle(b.pairs.map(p => ({ pair: p, say: Math.random() < 0.5 ? 0 : 1 })));
    return sequence(items, (it, next) => {
      const word = it.pair[it.say];
      const fb = h('div.ex-feedback');
      const play = () => speak(word, { rate: rate(app) * 0.9 });
      play();
      return h('div',
        h('p', 'Which word do you hear?'),
        button([icon('speaker'), ' Play again'], play, 'btn-ghost btn-sm'),
        choice(it.pair, it.say, ok => {
          score(ok ? 1 : 0, { word });
          put(fb, h(`div.feedback.${ok ? 'is-correct' : 'is-wrong'}`, h('p.fb-title', ok ? 'Correct' : `It was "${word}"`),
            h('p.fb-line', 'Listen to both: ', button(it.pair[0], () => speak(it.pair[0], { rate: rate(app) }), 'btn-ghost btn-sm'), ' ', button(it.pair[1], () => speak(it.pair[1], { rate: rate(app) }), 'btn-ghost btn-sm')),
            button('Next', next, 'btn-primary btn-sm')));
        }),
        fb);
    }, onDone);
  },

  stress(b, { app, score, onDone }) {
    return sequence(b.words, (w, next) => {
      const fb = h('div.ex-feedback');
      const play = () => speak(w.word, { rate: rate(app) * 0.85 });
      play();
      return h('div',
        h('p', 'Which part is stressed (stronger and longer)?'),
        button([icon('speaker'), ` ${w.word}`], play, 'btn-ghost btn-sm'),
        choice(w.syllables, w.stress, ok => {
          score(ok ? 1 : 0, { word: w.word });
          put(fb, h(`div.feedback.${ok ? 'is-correct' : 'is-wrong'}`, h('p.fb-title', ok ? 'Correct' : 'Not quite'),
            h('p.fb-line.stress-show', w.syllables.map((s, i) => (i === w.stress ? h('strong', s.toUpperCase()) : s)).flatMap((x, i, a) => (i < a.length - 1 ? [x, '·'] : [x]))),
            button('Next', next, 'btn-primary btn-sm')));
        }),
        fb);
    }, onDone);
  },

  'sound-choice'(b, { app, score, onDone }) {
    return sequence(b.words, (w, next) => {
      const fb = h('div.ex-feedback');
      const play = () => speak(w.word, { rate: rate(app) * 0.85 });
      play();
      return h('div',
        h('p', 'How does the ending sound?'),
        button([icon('speaker'), ` ${w.word}`], play, 'btn-ghost btn-sm'),
        choice(b.options, w.answer, ok => {
          score(ok ? 1 : 0, { word: w.word });
          put(fb, h(`div.feedback.${ok ? 'is-correct' : 'is-wrong'}`, h('p.fb-title', ok ? 'Correct' : `"${w.word}" ends in ${b.options[w.answer]}`), button('Next', next, 'btn-primary btn-sm')));
        }),
        fb);
    }, onDone);
  },

  'sentence-stress'(b, { app, score, onDone }) {
    return sequence(b.sentences, (s, next) => {
      const words = s.text.split(/\s+/);
      const chosen = new Set();
      const fb = h('div.ex-feedback');
      const btns = words.map((w, i) => h('button.tile', { type: 'button', 'aria-pressed': 'false', on: { click: () => {
        chosen.has(i) ? chosen.delete(i) : chosen.add(i);
        btns[i].classList.toggle('selected', chosen.has(i));
        btns[i].setAttribute('aria-pressed', chosen.has(i));
      } } }, w));
      const play = () => speak(s.text, { rate: rate(app) * 0.9 });
      play();
      const check = button('Check', () => {
        check.remove();
        const target = new Set(s.stressed);
        const hits = [...chosen].filter(i => target.has(i)).length;
        const union = new Set([...chosen, ...target]).size;
        const val = union ? hits / union : 0;
        score(val, { sentence: s.text });
        btns.forEach((b2, i) => { b2.disabled = true; b2.classList.add(target.has(i) ? 'ok' : chosen.has(i) ? 'bad' : 'plain'); });
        put(fb, h(`div.feedback.${val === 1 ? 'is-correct' : val >= 0.5 ? 'is-near' : 'is-wrong'}`,
          h('p.fb-title', val === 1 ? 'Correct' : 'The stressed words are highlighted'),
          h('p.fb-line', 'Content words (nouns, main verbs, question words) usually carry the stress.'),
          shadowing({ app, lines: [s.text], onRecorded: () => {} }),
          button('Next', next, 'btn-primary btn-sm')));
      }, 'btn-primary btn-sm');
      return h('div', h('p', 'Listen and tap the stressed words.'), button([icon('speaker'), ' Play'], play, 'btn-ghost btn-sm'), h('div.order-line', btns), check, fb);
    }, onDone);
  },

  intonation(b, { app, score, onDone }) {
    return sequence(b.items, (it, next) => {
      const fb = h('div.ex-feedback');
      return h('div',
        h('p.rec-model', it.text),
        h('p', 'Predict: does the voice go up or down at the end?'),
        choice(['up', 'down'], it.pattern === 'rise' ? 0 : 1, ok => {
          score(ok ? 1 : 0, { text: it.text });
          put(fb, h(`div.feedback.${ok ? 'is-correct' : 'is-wrong'}`,
            h('p.fb-title', ok ? 'Correct' : `It usually goes ${it.pattern === 'rise' ? 'up ↗' : 'down ↘'}`),
            h('p.fb-line', 'Now listen and copy the tune.'),
            shadowing({ app, lines: [it.text], onRecorded: () => {} }),
            button('Next', next, 'btn-primary btn-sm')));
        }, ['↗ Up', '↘ Down']),
        fb);
    }, onDone);
  },

  connected(b, { app, score, onDone }) {
    return sequence(b.items, (it, next) => {
      const input = h('input.text-input', { type: 'text', autocomplete: 'off', placeholder: 'Write the words you hear' });
      const fb = h('div.ex-feedback');
      const play = () => speak(it.text, { rate: rate(app) });
      play();
      const check = button('Check', () => {
        check.remove();
        input.disabled = true;
        const d = wordDiff(it.text, input.value);
        score(d.score, { text: it.text });
        put(fb, h(`div.feedback.${d.score === 1 ? 'is-correct' : d.score >= 0.6 ? 'is-near' : 'is-wrong'}`,
          h('p.fb-title', d.score === 1 ? 'Correct' : 'Here it is'),
          h('p.fb-line', h('span.fb-label', 'Written: '), it.text),
          it.note ? h('p.fb-line', h('span.fb-label', 'Sounds like: '), it.note) : null,
          button('Next', next, 'btn-primary btn-sm')));
      }, 'btn-primary btn-sm');
      input.addEventListener('keydown', e => { if (e.key === 'Enter' && check.isConnected) check.click(); });
      return h('div', h('p', 'Listen — the words are linked together. What are the words?'), button([icon('speaker'), ' Play'], play, 'btn-ghost btn-sm'), input, check, fb);
    }, onDone);
  },

  shadow(b, { app, logShadow, onDone }) {
    queueMicrotask(() => onDone?.());
    return shadowing({ app, lines: b.lines, onRecorded: ({ seconds }) => logShadow?.(seconds) });
  },
};

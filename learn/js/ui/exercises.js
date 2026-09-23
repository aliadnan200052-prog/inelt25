// ════════════════════════════════════════════════════════════
// Exercise widgets. One renderer for every exercise type; the
// checking itself lives in the engine (engine/feedback.js).
//
//   renderExercise(ex, { app, mode, onDone, hintable })
//   mode: 'learn'  → feedback after each answer (default)
//         'test'   → no feedback (placement, level checks)
//   onDone(check, { hintUsed, response })
// ════════════════════════════════════════════════════════════
import { h, ar, button, icon, add, put } from './dom.js';
import { checkExercise } from '../engine/feedback.js';
import { shuffle, firstLetterHint } from '../engine/text.js';
import { speak, stopSpeaking, canRecognise, recogniseOnce } from './speech.js';

export function renderExercise(ex, { app, mode = 'learn', onDone, hintable = false } = {}) {
  const root = h('div.exercise', { dataset: { type: ex.type } });
  let hintUsed = false;
  let done = false;
  const body = h('div.ex-body');
  const actions = h('div.ex-actions');
  const fb = h('div.ex-feedback', { 'aria-live': 'polite' });

  add(root, 
    h('p.ex-prompt', ex.prompt || defaultPrompt(ex)),
    ar(ex.prompt_ar, app),
    ex.sentence && ex.type !== 'correct' ? h('p.ex-sentence', ex.sentence) : null,
    ex.clue ? h('p.ex-clue', h('span.muted', 'Meaning: '), ex.clue) : null,
    body, actions, fb,
  );

  const widget = WIDGETS[ex.type]?.(ex, { app, submit }) || { el: h('p', `Unsupported exercise: ${ex.type}`), value: () => '' };
  add(body, widget.el);

  const checkBtn = button(mode === 'test' ? 'Next' : 'Check', () => submit(), 'btn-primary');
  const hintText = ex.hint || (hintable && ex.answers?.[0] ? firstLetterHint(ex.answers[0]) : null);
  const hintBtn = hintText && mode !== 'test'
    ? button('Hint', () => { hintUsed = true; hintBtn.replaceWith(h('span.hint', hintText)); }, 'btn-ghost btn-sm')
    : null;
  add(actions, checkBtn, hintBtn);

  function submit() {
    if (done) return;
    const response = widget.value();
    if (response === null || response === '' || (Array.isArray(response) && response.some(r => r == null))) {
      widget.focus?.();
      root.classList.add('shake');
      setTimeout(() => root.classList.remove('shake'), 400);
      return;
    }
    done = true;
    stopSpeaking();
    const check = checkExercise(ex, response);
    widget.lock?.(check);
    if (mode === 'test') { onDone?.(check, { hintUsed, response }); return; }
    put(actions);
    put(fb, feedbackPanel(ex, check, response, app));
    const next = button('Continue', () => onDone?.(check, { hintUsed, response }), 'btn-primary');
    add(actions, next);
    next.focus();
  }

  root.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      if (!done) submit();
    }
  });
  queueMicrotask(() => widget.focus?.());
  return root;
}

function defaultPrompt(ex) {
  return { dictation: 'Listen and write what you hear.', order: 'Put the words in order.', match: 'Match.', correct: 'Correct the sentence.' }[ex.type] || '';
}

/** Your answer → Better → Why. Short, one reason, at the learner's level. */
export function feedbackPanel(ex, check, response, app) {
  if (check.correct) {
    return h('div.feedback.is-correct', { role: 'status' },
      h('p.fb-title', icon('check'), ' Correct'),
      ex.type === 'produce' ? h('p.fb-line', 'You used the target language. Well done — read it aloud once.') : null,
      ex.type === 'produce' && ex.sample ? h('p.fb-line', h('span.fb-label', 'Another way: '), ex.sample) : null,
    );
  }
  const f = check.feedback || {};
  const panel = h(`div.feedback.${check.near ? 'is-near' : 'is-wrong'}`, { role: 'status' },
    h('p.fb-title', check.near ? 'Almost' : 'Not quite'),
  );
  if (ex.type === 'dictation' && check.diff) {
    add(panel, h('p.fb-line', h('span.fb-label', 'You missed: '),
      h('span.diff', check.diff.words.map(w => h(w.ok ? 'span.ok' : 'mark.miss', w.word + ' ')))));
  } else if (f.yourAnswer != null && ex.type !== 'mcq' && ex.type !== 'match') {
    add(panel, h('p.fb-line', h('span.fb-label', 'Your answer: '), h('span.your', String(f.yourAnswer))));
  } else if (ex.type === 'mcq') {
    add(panel, h('p.fb-line', h('span.fb-label', 'Your answer: '), h('span.your', String(f.yourAnswer))));
  }
  if (f.better) add(panel, h('p.fb-line', h('span.fb-label', ex.type === 'produce' ? 'Better: ' : ex.type === 'match' ? 'Answers: ' : 'Better: '), h('span.better', f.better)));
  if (f.why) add(panel, h('p.fb-line.fb-why', h('span.fb-label', 'Why: '), f.why));
  if (f.why_ar && app?.support) add(panel, ar(f.why_ar, app));
  if (ex.type === 'produce' && ex.sample && f.better !== ex.sample) add(panel, h('p.fb-line', h('span.fb-label', 'Model: '), ex.sample));
  return panel;
}

// ─── Widgets ────────────────────────────────────────────────
function textInput(placeholder = 'Type your answer') {
  return h('input.text-input.answer', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, placeholder, 'aria-label': placeholder });
}

function typed(ex, { before } = {}) {
  const input = textInput();
  const el = h('div', before, input);
  return {
    el,
    value: () => input.value.trim(),
    focus: () => input.focus(),
    lock: c => { input.disabled = true; input.classList.add(c.correct ? 'ok' : c.near ? 'near' : 'bad'); },
  };
}

const WIDGETS = {
  mcq(ex) {
    const order = ex.fixedOrder ? ex.options.map((_, i) => i) : shuffle(ex.options.map((_, i) => i));
    let chosen = null;
    const buttons = order.map(i => h('button.option', {
      type: 'button', role: 'radio', 'aria-checked': 'false',
      on: { click: () => { chosen = i; buttons.forEach(b => { const on = Number(b.dataset.i) === i; b.classList.toggle('selected', on); b.setAttribute('aria-checked', on); }); } },
      dataset: { i },
    }, ex.options[i]));
    return {
      el: h('div.options', { role: 'radiogroup' }, buttons),
      value: () => chosen,
      focus: () => buttons[0]?.focus(),
      lock: () => buttons.forEach(b => {
        b.disabled = true;
        const i = Number(b.dataset.i);
        if (i === Number(ex.answer)) b.classList.add('ok');
        else if (i === chosen) b.classList.add('bad');
      }),
    };
  },

  gap(ex) {
    const [before, after] = String(ex.text).split('___');
    const input = h('input.text-input.gap-input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, 'aria-label': 'Missing word(s)', size: Math.max(6, (ex.answers?.[0] || '').length + 2) });
    return {
      el: h('p.gap-sentence', before, input, after),
      value: () => input.value.trim(),
      focus: () => input.focus(),
      lock: c => { input.disabled = true; input.classList.add(c.correct ? 'ok' : c.near ? 'near' : 'bad'); },
    };
  },

  recall: ex => typed(ex),
  transform: ex => typed(ex, { before: h('p.ex-source', ex.source) }),
  correct: ex => {
    const w = typed(ex, { before: h('p.ex-source.is-wrongish', ex.sentence) });
    return w;
  },

  order(ex) {
    const tiles = shuffle(ex.tokens.map((t, i) => ({ t, i })));
    const placed = [];
    const line = h('div.order-line', { 'aria-label': 'Your sentence' });
    const bank = h('div.order-bank');
    function draw() {
      put(line, ...(placed.length ? placed.map((p, k) => h('button.tile.placed', { type: 'button', on: { click: () => { placed.splice(k, 1); draw(); } } }, p.t)) : [h('span.muted', 'Tap the words in order')]));
      put(bank, ...tiles.map(p => h('button.tile', { type: 'button', disabled: placed.includes(p), on: { click: () => { placed.push(p); draw(); } } }, p.t)));
    }
    draw();
    return {
      el: h('div.order', line, bank),
      value: () => (placed.length === tiles.length ? placed.map(p => p.t).join(' ') : null),
      focus: () => bank.querySelector('button:not([disabled])')?.focus(),
      lock: c => { line.classList.add(c.correct ? 'ok' : 'bad'); line.querySelectorAll('button').forEach(b => (b.disabled = true)); bank.remove(); },
    };
  },

  match(ex) {
    const rights = shuffle(ex.pairs.map((p, i) => ({ t: p[1], i })));
    const selects = ex.pairs.map(p => h('select.text-input.match-select', { 'aria-label': `Match for ${p[0]}` },
      h('option', { value: '' }, 'Choose…'), rights.map(r => h('option', { value: r.i }, r.t))));
    return {
      el: h('div.match', ex.pairs.map((p, i) => h('div.match-row', h('span.match-left', p[0]), selects[i]))),
      value: () => selects.map(s => (s.value === '' ? null : Number(s.value))),
      focus: () => selects[0]?.focus(),
      lock: () => selects.forEach((s, i) => { s.disabled = true; s.classList.add(Number(s.value) === i ? 'ok' : 'bad'); }),
    };
  },

  dictation(ex, { app }) {
    const input = textInput('Write what you hear');
    const rate = app?.progress?.profile?.speechRate || 0.95;
    const el = h('div',
      h('div.audio-row',
        button([icon('play'), ' Play'], () => speak(ex.text, { rate, audio: ex.audio }), 'btn-ghost btn-sm'),
        button('Slower', () => speak(ex.text, { rate: Math.max(0.6, rate - 0.3) }), 'btn-ghost btn-sm')),
      input);
    queueMicrotask(() => speak(ex.text, { rate, audio: ex.audio }));
    return {
      el,
      value: () => input.value.trim(),
      focus: () => input.focus(),
      lock: c => { input.disabled = true; input.classList.add(c.correct ? 'ok' : c.near ? 'near' : 'bad'); },
    };
  },

  produce(ex, { app }) {
    const ta = h('textarea.text-input.produce', { rows: 3, placeholder: 'Write your own sentence(s)', 'aria-label': 'Your sentence', spellcheck: true });
    const extras = h('div.audio-row');
    if (ex.targetLabel) add(extras, h('span.chip', 'Use: ', ex.targetLabel));
    if (canRecognise() && app?.progress?.profile?.useRecognition) {
      add(extras, button([icon('mic'), ' Say it'], async () => {
        try { const t = await recogniseOnce(); if (t) ta.value = (ta.value ? ta.value + ' ' : '') + t; } catch { /* ignore */ }
      }, 'btn-ghost btn-sm'));
    }
    return {
      el: h('div', extras, ta),
      value: () => ta.value.trim(),
      focus: () => ta.focus(),
      lock: () => { ta.disabled = true; },
    };
  },
};

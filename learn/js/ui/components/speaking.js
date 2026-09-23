// Speaking: Listen → Repeat (record) → Compare → Try again.
// Recordings stay in this browser tab (object URLs) and are never
// uploaded. Speaking is practice evidence, not graded: we log that it
// happened and for how long, and never claim to score it.
import { h, icon, button, ar, add, put } from '../dom.js';
import { speak, stopSpeaking, canRecord, startRecording, canRecognise, recogniseOnce } from '../speech.js';
import { wordDiff } from '../../engine/text.js';

/**
 * One recorder. `model` is the sentence to imitate (null for free speech).
 * onRecorded({ seconds }) fires once per recording.
 * onRecognised(score) fires if the learner checks with speech recognition.
 */
export function recorder({ app, model = null, maxSeconds = 0, onRecorded, onRecognised, compact = false }) {
  const rate = () => app.progress.profile.speechRate || 0.95;
  const el = h(`div.recorder${compact ? '.compact' : ''}`);
  const row = h('div.rec-row');
  const out = h('div.rec-out', { 'aria-live': 'polite' });
  let rec = null, timer = null, url = null;

  const modelBtn = model ? button([icon('speaker'), ' Listen'], () => speak(model, { rate: rate() }), 'btn-ghost btn-sm') : null;
  const recBtn = button([icon('mic'), ' Record'], toggle, 'btn-primary btn-sm');
  add(row, modelBtn, recBtn);

  if (!canRecord()) {
    recBtn.replaceWith(button('I said it aloud', () => { onRecorded?.({ seconds: 0 }); put(out, h('p.muted', 'Good. (Recording isn\'t available in this browser.)')); }, 'btn-ghost btn-sm'));
  }

  async function toggle() {
    if (rec) return stop();
    stopSpeaking();
    try {
      rec = await startRecording();
    } catch {
      put(out, h('p.muted', 'Microphone blocked. Allow it in your browser, or just say it aloud.'));
      return;
    }
    let s = 0;
    put(recBtn, icon('stop'), ' Stop 0:00');
    recBtn.classList.add('recording');
    timer = setInterval(() => {
      s++;
      put(recBtn, icon('stop'), ` Stop ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
      if (maxSeconds && s >= maxSeconds) stop();
    }, 1000);
  }

  async function stop() {
    clearInterval(timer);
    const r = rec; rec = null;
    recBtn.classList.remove('recording');
    put(recBtn, icon('mic'), ' Try again');
    const res = await r.stop();
    if (url) URL.revokeObjectURL(url);
    url = res.url;
    const mine = h('audio', { src: url, preload: 'auto' });
    put(out, 
      h('div.compare',
        button([icon('play'), ' My recording'], () => { mine.currentTime = 0; mine.play(); }, 'btn-ghost btn-sm'),
        model ? button([icon('speaker'), ' Model'], () => speak(model, { rate: rate() }), 'btn-ghost btn-sm') : null,
        model ? button('Compare: model, then me', async () => { await speak(model, { rate: rate() }); mine.currentTime = 0; mine.play(); }, 'btn-ghost btn-sm') : null,
      ),
      mine,
    );
    onRecorded?.({ seconds: res.seconds });
  }

  if (model && canRecognise() && app.progress.profile.useRecognition) {
    add(row, button('Check my words', async () => {
      put(out, h('p.muted', 'Listening… say the sentence now.'));
      try {
        const heard = await recogniseOnce();
        const d = wordDiff(model, heard);
        put(out, 
          h('p.fb-line', h('span.fb-label', 'Heard: '), heard || '(nothing)'),
          h('p.diff', d.words.map(w => h(w.ok ? 'span.ok' : 'mark.miss', w.word + ' '))),
          h('p.muted.small', 'Speech recognition is only a rough guide — accents it doesn\'t expect can look like errors.'),
        );
        onRecognised?.(d.score);
      } catch {
        put(out, h('p.muted', 'Speech recognition isn\'t available right now.'));
      }
    }, 'btn-ghost btn-sm'));
  }

  add(el, model && !compact ? h('p.rec-model', model) : null, row, out);
  el.cleanup = () => { clearInterval(timer); rec?.cancel(); if (url) URL.revokeObjectURL(url); };
  return el;
}

/** Shadowing list: each line → listen, repeat, compare, try again. */
export function shadowing({ app, lines, onRecorded, onRecognised }) {
  return h('ol.shadow-list', lines.map(line => h('li',
    h('p.rec-model', line),
    recorder({ app, model: line, compact: true, onRecorded, onRecognised }),
  )));
}

/**
 * Speaking task, three steps: controlled → guided → free.
 * log(mode, seconds) is called for the progress model.
 */
export function speakingTask({ app, speaking, log, onDone }) {
  const steps = ['controlled', 'guided', 'free'].filter(k => speaking[k]);
  let i = 0;
  const el = h('div.speaking');
  // One log entry per step, with the total seconds recorded in it.
  const seconds = {};
  const logOnce = (mode, s) => { seconds[mode] = (seconds[mode] || 0) + (s || 0); };

  function draw() {
    const mode = steps[i];
    const t = speaking[mode];
    const header = h('div.step-head',
      h('span.step-kicker', `${i + 1} of ${steps.length} · ${{ controlled: 'Controlled practice', guided: 'Guided speaking', free: 'Free speaking' }[mode]}`),
      h('p.lead', t.instruction), ar(t.instruction_ar, app));
    let content;
    if (mode === 'controlled') {
      content = shadowing({ app, lines: t.lines || [], onRecorded: ({ seconds }) => logOnce('controlled', seconds) });
    } else if (mode === 'guided') {
      content = h('div',
        h('div.frame', (t.frame || []).map(f => h('p.frame-line', f))),
        recorder({ app, maxSeconds: 90, onRecorded: ({ seconds }) => logOnce('guided', seconds) }),
        checklist(t.checklist));
    } else {
      content = freeSpeaking(app, t, s => logOnce('free', s));
    }
    const next = button(i < steps.length - 1 ? 'Next step' : 'Continue', () => {
      el.querySelectorAll('.recorder').forEach(r => r.cleanup?.());
      log(mode, seconds[mode] || 0, !(mode in seconds));
      if (i < steps.length - 1) { i++; draw(); } else onDone?.();
    }, 'btn-primary');
    put(el, header, content, h('div.ex-actions', next));
  }
  draw();
  return el;
}

function freeSpeaking(app, t, onRecorded) {
  const wrap = h('div.free');
  const prep = t.prepSeconds || 30;
  const ideas = h('div.free-help',
    t.useful?.length ? h('div', h('p.section-label', 'Useful language'), h('ul.chips', t.useful.map(u => h('li.chip', u)))) : null,
    t.ideas?.length ? h('div', h('p.section-label', 'Ideas'), h('ul', t.ideas.map(u => h('li', u)))) : null,
  );
  const timerEl = h('p.prep-timer', `Preparation: ${prep} s`);
  const startBtn = button(`Start ${prep} s preparation`, () => {
    let left = prep;
    startBtn.disabled = true;
    const iv = setInterval(() => {
      left--;
      timerEl.textContent = left > 0 ? `Preparation: ${left} s — think, don't write full sentences.` : 'Now speak!';
      if (left <= 0) { clearInterval(iv); startBtn.remove(); }
    }, 1000);
  }, 'btn-ghost btn-sm');
  add(wrap, ideas, h('div.audio-row', timerEl, startBtn),
    recorder({ app, maxSeconds: t.maxSeconds || 90, onRecorded: ({ seconds }) => onRecorded(seconds) }),
    h('p.muted.small', `Up to ${t.maxSeconds || 90} seconds. Focus on getting your message across — mistakes are fine here.`),
    checklist(t.checklist, 'After speaking, tick what you managed:'));
  return wrap;
}

function checklist(items, title = 'Did you…') {
  if (!items?.length) return null;
  return h('fieldset.checklist', h('legend', title), items.map(c => h('label', h('input', { type: 'checkbox' }), ' ', c)));
}

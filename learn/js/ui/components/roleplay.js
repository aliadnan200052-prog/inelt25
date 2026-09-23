// Role-play: a conversation with a character, with a communicative
// goal checklist. Fluency first — no correction turn by turn; at the
// end, goals achieved + at most two points of language to notice.
import { h, icon, button, ar, add, put } from '../dom.js';
import * as engine from '../../engine/roleplay.js';
import { speak, stopSpeaking, canRecognise, recogniseOnce } from '../speech.js';

export function roleplayView({ app, rp, onFinish }) {
  let state = engine.start(rp);
  const rate = () => app.progress.profile.speechRate || 0.95;
  const log = h('div.chat', { 'aria-live': 'polite' });
  const goals = h('ul.goals');
  const help = h('div.rp-help');
  const input = h('input.text-input', { type: 'text', autocomplete: 'off', placeholder: `Reply as the ${rp.studentRole.toLowerCase()}…`, 'aria-label': 'Your reply' });
  const send = button('Send', submit, 'btn-primary');
  const mic = canRecognise() && app.progress.profile.useRecognition
    ? button([icon('mic')], async () => {
      mic.disabled = true;
      try { const t = await recogniseOnce(); if (t) { input.value = t; submit(); } } catch { /* ignore */ }
      mic.disabled = false;
    }, 'icon-btn', { 'aria-label': 'Speak your reply' })
    : null;
  const inputRow = h('form.chat-input', { on: { submit: e => { e.preventDefault(); submit(); } } }, input, mic, send);

  function bubble(who, text) {
    if (!text) return;
    const b = h(`div.bubble.${who}`,
      who === 'character' ? h('span.who', rp.character || rp.characterRole) : null,
      h('span', text),
      who === 'character' ? button([icon('speaker')], () => speak(text, { speaker: rp.character, rate: rate() }), 'icon-btn small', { 'aria-label': 'Listen again' }) : null);
    add(log, b);
    log.scrollTop = log.scrollHeight;
    if (who === 'character') speak(text, { speaker: rp.character, rate: rate() });
  }

  function drawGoals() {
    put(goals, ...rp.goals.map(g => h(`li${state.goalsDone.includes(g.id) ? '.done' : ''}`,
      h('span.goal-dot', state.goalsDone.includes(g.id) ? icon('check') : ''), g.label)));
  }

  function submit() {
    const text = input.value.trim();
    if (!text || state.ended) return;
    stopSpeaking();
    input.value = '';
    bubble('student', text);
    const r = engine.respond(rp, state, text);
    state = r.state;
    put(help);
    if (r.reply) setTimeout(() => bubble('character', r.reply), 350);
    if (r.hint) add(help, h('p.hint', r.hint));
    if (r.model) add(help, h('p.hint', h('span.fb-label', 'You could say: '), r.model));
    drawGoals();
    if (state.ended) setTimeout(finish, 900);
    else input.focus();
  }

  function finish() {
    inputRow.remove();
    const sum = engine.summary(rp, state);
    const panel = h('div.rp-summary',
      h('h3', `Goals achieved: ${sum.achieved} of ${sum.total}`),
      h('ul.goals.final', sum.goals.map(g => h(`li${g.done ? '.done' : ''}`, h('span.goal-dot', g.done ? icon('check') : '–'), g.label))),
      sum.errors.length ? h('div.notice-lang',
        h('p.section-label', 'Language to notice'),
        sum.errors.map(e => h('p.fb-line', h('span.your', e.found), ' → ', h('span.better', e.better), h('span.muted', ` — ${e.why}`)))) : null,
      sum.useful.length ? h('div', h('p.section-label', 'Useful language for this situation'), h('ul.chips', sum.useful.map(u => h('li.chip', u)))) : null,
      h('div.ex-actions',
        button('Try the conversation again', () => { const fresh = roleplayView({ app, rp, onFinish }); el.replaceWith(fresh); }, 'btn-ghost'),
        button('Continue', () => onFinish?.(sum, false), 'btn-primary')),
    );
    add(el, panel);
    onFinish?.(sum, true);
  }

  const el = h('div.roleplay',
    h('div.rp-brief',
      h('p.section-label', rp.setting || 'Role-play'),
      h('p', h('strong', 'You: '), rp.studentRole, ' · ', h('strong', `${rp.character || 'Partner'}: `), rp.characterRole),
      h('p.muted.small', 'Talk naturally to reach the goals. Mistakes are OK — the aim is to get your message across.'),
      ar('تحدث بشكل طبيعي لتحقيق الأهداف. الأخطاء مقبولة — المهم أن تصل رسالتك.', app),
      h('p.section-label', 'Your goals'), goals),
    h('div.rp-main', log, help, inputRow),
  );
  drawGoals();
  setTimeout(() => { bubble('character', state.log[0].text); input.focus(); }, 200);
  return el;
}

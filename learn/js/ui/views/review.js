// Daily review: due items, each in a sentence the learner hasn't
// answered yet. Wrong answers come back within minutes; right ones
// move further away. Nothing becomes "Mastered" from one answer.
import { h, button, icon, relTime, add, put } from '../dom.js';
import { buildSession, answerTask } from '../../engine/review.js';
import { renderExercise } from '../exercises.js';
import { stageCounts } from '../../engine/srs.js';

const STAGE_LABEL = { new: 'New', learning: 'Learning', review: 'Review', mastered: 'Mastered' };

export async function reviewView(app) {
  const forced = app.forced();
  await app.progress.ensureStates(forced);
  const states = app.progress.states;
  const tasks = buildSession(app.data.itemsById, states, Date.now(), { limit: 15, forced });
  const root = h('div.page.review');

  if (!tasks.length) {
    const upcoming = states.filter(s => s.stage !== 'new').sort((a, b) => a.due - b.due)[0];
    return h('div.page.review',
      h('header.page-head', h('a.icon-btn', { href: '#/', 'aria-label': 'Home' }, icon('back')), h('h1', 'Review')),
      h('section.card.empty',
        h('h2', 'Nothing to review right now'),
        h('p.muted', upcoming ? `Next item comes back ${relTime(upcoming.due)}. Reviewing before you start to forget is what makes it stick — reviewing early adds little.` : 'Finish a lesson and its words and phrases will appear here.'),
        h('a.btn.btn-primary', { href: '#/' }, 'Home')));
  }

  const before = stageCounts(states);
  const results = [];
  let i = 0;

  function next() {
    if (i >= tasks.length) return finish();
    const t = tasks[i++];
    const item = app.data.itemsById[t.itemId];
    const state = app.progress.state(t.itemId);
    put(root, 
      h('header.lesson-head',
        h('div.lesson-top',
          h('a.icon-btn', { href: '#/', 'aria-label': 'Stop review' }, icon('back')),
          h('div.lesson-title', h('span.muted.small', 'Daily review'), h('strong', `${i} of ${tasks.length}`)),
          h('span.badge.badge-muted', STAGE_LABEL[state.stage])),
        h('div.bar', h('span', { style: { width: `${Math.round(((i - 1) / tasks.length) * 100)}%` } }))),
      h('section.card',
        h('p.kicker', { recognition: 'Recognise', recall: 'Recall', production: 'Use it' }[t.task]),
        renderExercise(t.exercise, {
          app, hintable: t.task === 'recall',
          onDone: async (_, { hintUsed, response }) => {
            const r = answerTask(t, state, response, Date.now(), { hintUsed });
            await app.progress.putState(r.state);
            app.progress.logAttempt({ source: 'review', exerciseId: t.exercise.id, itemIds: [t.itemId], skill: t.exercise.skill, task: t.task, correct: r.check.correct, score: r.check.score, response });
            results.push({ item, task: t, ...r, from: state.stage });
            next();
          },
        })));
  }

  function finish() {
    const after = stageCounts(app.progress.states);
    const right = results.filter(r => r.quality !== 'again').length;
    const again = results.filter(r => r.quality === 'again');
    put(root, 
      h('header.page-head', h('h1', 'Review done')),
      h('section.card',
        h('p', h('strong', `${right} of ${results.length}`), ' recalled.'),
        again.length ? h('div', h('p.section-label', 'Coming back in a few minutes'), h('ul.chips', again.map(r => h('li.chip', r.item.form)))) : null,
        h('table.result-table', h('thead', h('tr', h('th', ''), ...Object.values(STAGE_LABEL).map(l => h('th', l)))),
          h('tbody',
            h('tr', h('th', 'Before'), ...Object.keys(STAGE_LABEL).map(k => h('td', before[k] || 0))),
            h('tr', h('th', 'Now'), ...Object.keys(STAGE_LABEL).map(k => h('td', after[k] || 0))))),
        h('p.muted.small', 'Mastered needs several correct reviews over at least three weeks, in different sentences, including one sentence of your own.')),
      h('div.ex-actions', h('a.btn.btn-ghost', { href: '#/library/vocabulary' }, 'My vocabulary'), h('a.btn.btn-primary', { href: '#/' }, 'Done')));
  }

  next();
  return root;
}

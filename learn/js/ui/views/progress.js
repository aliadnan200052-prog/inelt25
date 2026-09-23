// Progress — real evidence per skill, and "What you can do now".
import { h, pct } from '../dom.js';
import { profile, canDoNow, levelReadiness } from '../../engine/progress.js';

export async function progressView(app) {
  const { catalog, items } = app.data;
  const now = Date.now();
  const P = app.progress;
  const prof = profile({ attempts: P.attempts, states: P.states, lessonProgress: P.lessonProgress, speakingLogs: P.speakingLogs, catalog }, now);
  const can = canDoNow(catalog, P.lessonProgress);
  const level = app.profile.currentLevel;
  const r = levelReadiness(level, { catalog, lessonProgress: P.lessonProgress, states: P.states, items, speakingLogs: P.speakingLogs, levelResults: P.levelResults });

  const meter = (label, s, note) => h('div.meter',
    h('div.meter-head', h('span', label), h('strong', s?.score == null ? '—' : pct(s.score))),
    h('div.bar', h('span', { style: { width: `${Math.round((s?.score || 0) * 100)}%` } })),
    h('p.muted.small', s?.n ? `${note} · based on ${s.n} answer${s.n === 1 ? '' : 's'}` : 'Not enough evidence yet'));

  const st = prof.vocabulary.stages;
  const sp = prof.speaking;

  return h('div.page.progress',
    h('header.page-head', h('h1', 'Your progress'), h('p.muted', 'Measured from what you actually did — recent answers count more.')),

    h('section.card',
      h('h2', 'What you can do now'),
      can.length ? can.map(g => h('div.cando-group', h('p.section-label', g.level), h('ul.cando', g.items.map(c => h('li', c.text)))))
        : h('p.muted', 'Complete your first lesson and its can-do statements will appear here.')),

    h('section.card',
      h('h2', `Ready to leave ${level}?`),
      h('ul.checks', r.checks.map(c => h(`li${c.done ? '.done' : ''}`, h('span.status-dot', c.done ? '✓' : ''), h('span', c.label, h('br'), h('span.muted.small', c.detail))))),
      r.canTakeCheck && !r.passed ? h('a.btn.btn-primary', { href: `#/check/${level}` }, 'Take the level check') : null),

    h('section.card',
      h('h2', 'Skills'),
      h('div.meters',
        meter('Listening comprehension', prof.listening, 'Listening questions'),
        meter('Reading', prof.reading, 'Reading questions'),
        meter('Vocabulary retention', prof.vocabulary, 'Recalled a day or more after learning'),
        meter('Grammar accuracy', prof.grammar, 'Grammar practice and recall'),
        meter('Pronunciation (perception)', prof.pronunciation, 'Sounds, stress and intonation tasks')),
      h('div.stat-row',
        stat('Vocabulary', `${st.learning} learning · ${st.review} review · ${st.mastered} mastered`),
        stat('Speaking practice', `${sp.controlled} controlled · ${sp.guided} guided · ${sp.free} free · ${sp.minutes} min recorded`),
        stat('Functional communication', prof.functional.attempted ? `${prof.functional.achieved} of ${prof.functional.attempted} role-play goals reached` : 'No role-plays yet'),
        stat('Lessons completed', `${prof.lessons.done} of ${catalog.lessons.length}`)),
      h('p.muted.small', 'Speaking is shown as practice, not a score: the app can\'t judge your speaking reliably, so it doesn\'t pretend to.')),

    app.profile.placement ? h('section.card',
      h('h2', 'Placement estimate'),
      h('p', `Estimated ${app.profile.placement.overall} on ${new Date(app.profile.placement.takenAt).toLocaleDateString()} — `,
        Object.entries(app.profile.placement.bySkill).map(([k, v]) => `${k} ${v}`).join(', '), '. Speaking was not measured.')) : null,
  );
}

function stat(label, value) {
  return h('div.stat', h('p.section-label', label), h('p', value));
}

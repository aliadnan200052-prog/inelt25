// Home — one primary action: the lesson the learner needs next.
import { h, icon, button } from '../dom.js';
import { nextLesson, levelReadiness, lessonsOfLevel, nextLevel } from '../../engine/progress.js';
import { stagesFor } from '../../engine/lesson.js';
import { estimateMinutes } from '../../engine/srs.js';

export async function homeView(app) {
  const { catalog, items } = app.data;
  const p = app.profile;
  const lp = app.progress.lessonProgress;
  const level = p.currentLevel;
  const levelInfo = catalog.levels.find(l => l.code === level);
  const due = app.dueCount();

  const readiness = levelReadiness(level, {
    catalog, lessonProgress: lp, states: app.progress.states, items,
    speakingLogs: app.progress.speakingLogs, levelResults: app.progress.levelResults,
  });

  // ── Continue learning ──
  const next = nextLesson(catalog, lp, level);
  let primary;
  if (next) {
    const prog = lp[next.id];
    let stageInfo = `${next.minutes} min · ${next.topic}`;
    let ratio = 0;
    if (prog?.status === 'in_progress') {
      try {
        const body = await app.content.getLesson(next.id);
        const total = stagesFor(body).length;
        ratio = (prog.stage || 0) / total;
        stageInfo = `Stage ${(prog.stage || 0) + 1} of ${total} · ${next.topic}`;
      } catch { /* lesson file missing: show without stage */ }
    } else if (prog?.status === 'revisit') {
      stageInfo = `Worth revisiting: ${prog.weak?.join(', ') || 'some stages were weak'}`;
    }
    primary = h('section.card.continue',
      h('p.kicker', prog ? 'Continue learning' : 'Next lesson'),
      h('h2', next.title),
      h('p.muted', stageInfo),
      ratio ? h('div.bar', h('span', { style: { width: `${Math.round(ratio * 100)}%` } })) : null,
      h('div.continue-row',
        h('p.small.muted', next.canDo?.[0] ? `You'll be able to: ${next.canDo[0].replace(/^I can /, '')}` : ''),
        h('a.btn.btn-primary', { href: `#/lesson/${next.id}` }, prog ? 'Continue' : 'Start', icon('arrow'))));
  } else if (readiness.canTakeCheck && !readiness.passed) {
    primary = h('section.card.continue',
      h('p.kicker', 'Level check'),
      h('h2', `You're ready for the ${level} check`),
      h('p.muted', 'Every section must pass on its own — listening, reading, vocabulary and grammar.'),
      h('div.continue-row', h('span'), h('a.btn.btn-primary', { href: `#/check/${level}` }, 'Take the check', icon('arrow'))));
  } else {
    const todo = readiness.checks.filter(c => !c.done);
    primary = h('section.card.continue',
      h('p.kicker', `Finishing ${level}`),
      h('h2', readiness.passed ? `${level} complete` : 'Almost ready for the level check'),
      readiness.passed
        ? h('p.muted', nextLevel(level) ? `Move on to ${nextLevel(level)} from the learning path.` : 'You have finished the course content. Keep reviewing to keep it.')
        : h('ul.todo', todo.map(c => h('li', c.label, h('span.muted', ` — ${c.detail}`)))),
      h('div.continue-row', h('span'), h('a.btn.btn-primary', { href: '#/path' }, 'Open learning path', icon('arrow'))));
  }

  // ── Today's review ──
  const review = h('section.card.review-card',
    h('div',
      h('p.kicker', "Today's review"),
      due ? h('p', h('strong', `${due} item${due === 1 ? '' : 's'}`), h('span.muted', ` · about ${estimateMinutes(Math.min(due, 15))} min`))
        : h('p.muted', app.progress.states.length ? 'Nothing due right now. Items come back just before you would forget them.' : 'Words and phrases from your lessons will come back here.')),
    due ? h('a.btn.btn-primary', { href: '#/review' }, 'Start') : null);

  // ── Skill shortcuts (quiet) ──
  const shortcuts = h('nav.shortcuts', { 'aria-label': 'Practice by skill' },
    [['listening', 'Listening', 'listen'], ['speaking', 'Speaking', 'speak'], ['vocabulary', 'Vocabulary', 'words'], ['grammar', 'Grammar', 'grammar']]
      .map(([k, label, ic]) => h('a.shortcut', { href: `#/library/${k}` }, icon(ic), h('span', label))));

  // ── Level progress (checks, not points) ──
  const doneChecks = readiness.checks.filter(c => c.done).length;
  const lessonsDone = lessonsOfLevel(catalog, level).filter(l => lp[l.id]?.status === 'completed').length;
  const lvl = h('a.card.level-card', { href: '#/progress' },
    h('div', h('p.kicker', `${level} · ${levelInfo?.name || ''}`),
      h('p', `${lessonsDone} of ${lessonsOfLevel(catalog, level).length} lessons · ${doneChecks} of ${readiness.checks.length} level checks met`)),
    h('div.dots', readiness.checks.map(c => h(`span.dot${c.done ? '.on' : ''}`, { title: c.label }))),
    icon('arrow'));

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return h('div.page.home',
    h('header.page-head', h('h1', `${greet}${p.name ? ', ' + p.name : ''}`)),
    primary, review, shortcuts, lvl);
}

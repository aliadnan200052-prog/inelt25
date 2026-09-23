// Learning path: A0 → C1, levels → units → lessons → level check.
// Earlier lessons always stay open for revision.
import { h, icon } from '../dom.js';
import { levelReadiness, lessonsOfLevel } from '../../engine/progress.js';

const STATUS = {
  completed: ['done', 'Completed'],
  revisit: ['revisit', 'Worth revisiting'],
  in_progress: ['progress', 'In progress'],
};

export async function pathView(app) {
  const { catalog, items } = app.data;
  const lp = app.progress.lessonProgress;
  const current = app.profile.currentLevel;

  const levels = [...catalog.levels].sort((a, b) => a.sort - b.sort).map(lv => {
    const unlocked = app.levelUnlocked(lv.code);
    const lessons = lessonsOfLevel(catalog, lv.code);
    const done = lessons.filter(l => lp[l.id]?.status === 'completed').length;
    const r = levelReadiness(lv.code, { catalog, lessonProgress: lp, states: app.progress.states, items, speakingLogs: app.progress.speakingLogs, levelResults: app.progress.levelResults });

    const units = catalog.units.filter(u => u.level === lv.code).sort((a, b) => a.sort - b.sort).map(u =>
      h('div.unit',
        h('h3.unit-title', u.title, h('span.muted', ` — ${u.summary || ''}`)),
        h('ol.lesson-list', catalog.lessons.filter(l => l.unitId === u.id && l.status !== 'draft').sort((a, b) => a.sort - b.sort).map(l => {
          const st = STATUS[lp[l.id]?.status];
          const inner = [
            h(`span.status-dot${st ? '.' + st[0] : ''}`, { 'aria-label': st ? st[1] : 'Not started' }, st?.[0] === 'done' ? icon('check') : ''),
            h('span.lesson-text', h('span.lesson-title', l.title), h('span.muted.small', `${l.topic} · ${l.minutes} min`)),
          ];
          return h('li', unlocked ? h('a.lesson-link', { href: `#/lesson/${l.id}` }, inner, icon('arrow')) : h('div.lesson-link.locked', inner));
        })),
      ));

    const check = h('div.check-row',
      h('div', h('strong', `${lv.code} level check`), h('p.muted.small', r.passed ? 'Passed' : r.canTakeCheck ? 'Ready when you are' : `${r.checks.filter(c => c.done).length} of ${r.checks.length} requirements met`)),
      unlocked && r.canTakeCheck && !r.passed ? h('a.btn.btn-primary.btn-sm', { href: `#/check/${lv.code}` }, 'Take the check')
        : r.passed ? h('span.badge.badge-success', 'Passed') : h('a.btn.btn-ghost.btn-sm', { href: '#/progress' }, 'See requirements'));

    return h(`details.level-block${lv.code === current ? '.current' : ''}${unlocked ? '' : '.locked'}`, { open: lv.code === current },
      h('summary',
        h('span.level-code', lv.code),
        h('span.level-name', h('strong', lv.name), h('span.muted.small', lv.summary)),
        unlocked ? h('span.level-count.muted.small', `${done}/${lessons.length}`) : h('span.lock', icon('lock'))),
      unlocked ? null : h('p.locked-note', `Unlocks when you pass the ${prevCode(catalog, lv.code)} level check (or through the placement test).`),
      units, check);
  });

  return h('div.page', h('header.page-head', h('h1', 'Learning path'), h('p.muted', 'Levels → units → lessons → review → level check. Earlier lessons stay open.')), h('div.levels', levels));
}

function prevCode(catalog, code) {
  const sorted = [...catalog.levels].sort((a, b) => a.sort - b.sort).map(l => l.code);
  return sorted[sorted.indexOf(code) - 1] || code;
}

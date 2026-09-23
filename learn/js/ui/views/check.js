// Level check: four sections, each must pass on its own, plus a
// speaking task that is recorded and self-checked (not scored).
import { h, button, icon, pct, add, put } from '../dom.js';
import { levelReadiness, gradeLevelCheck, nextLevel, SECTION_PASS, LEVEL_ORDER } from '../../engine/progress.js';
import { renderExercise } from '../exercises.js';
import { listeningPlayer } from '../components/listening.js';
import { recorder } from '../components/speaking.js';

export async function levelCheckView(app, level) {
  const { catalog, items } = app.data;
  const P = app.progress;
  const r = levelReadiness(level, { catalog, lessonProgress: P.lessonProgress, states: P.states, items, speakingLogs: P.speakingLogs, levelResults: P.levelResults });
  const assessments = await app.content.getAssessments();
  const a = assessments[level];
  const page = h('div.page.check');

  if (!a) return h('div.page.empty', h('h1', 'No level check yet'), h('p.muted', 'An administrator hasn\'t created the check for this level.'));
  if (!app.levelUnlocked(level) || !r.canTakeCheck) {
    return h('div.page',
      h('header.page-head', h('a.icon-btn', { href: '#/path', 'aria-label': 'Back' }, icon('back')), h('h1', `${level} level check`)),
      h('section.card', h('p', 'The check opens when these are done:'),
        h('ul.checks', r.checks.slice(0, 3).map(c => h(`li${c.done ? '.done' : ''}`, h('span.status-dot', c.done ? '✓' : ''), h('span', c.label, h('br'), h('span.muted.small', c.detail)))))));
  }

  const scores = {};
  let si = 0;

  function intro() {
    put(page, 
      h('header.page-head', h('a.icon-btn', { href: '#/path', 'aria-label': 'Back' }, icon('back')), h('h1', a.title || `${level} level check`)),
      h('section.card',
        h('p', `Four sections — ${a.sections.map(s => s.skill).join(', ')} — and a short speaking task.`),
        h('p', `Each section needs ${Math.round(SECTION_PASS * 100)}% on its own. A strong section can't make up for a weak one.`),
        h('p.muted.small', 'No feedback until the end. The speaking task is recorded for you to listen back to; it is not scored.'),
        h('div.ex-actions', button('Begin', section, 'btn-primary'))));
  }

  function section() {
    if (si >= a.sections.length) return speaking();
    const sec = a.sections[si++];
    let i = 0, sum = 0;
    let stimulus = null;
    if (sec.script) { const p = listeningPlayer({ app, script: sec.script, allowTranscript: false }); app.onLeave(() => p.stop()); stimulus = p.el; }
    if (sec.text) stimulus = h('article.reading-text', sec.text);
    const slot = h('div');
    const nextQ = () => {
      if (i >= sec.items.length) { scores[sec.skill] = sum / sec.items.length; section(); return; }
      const ex = { ...sec.items[i++], skill: sec.skill };
      put(slot, h('p.ex-count.muted.small', `${i} of ${sec.items.length}`), renderExercise(ex, { app, mode: 'test', onDone: check => {
        sum += check.correct ? 1 : check.near ? 0.5 : 0;
        P.logAttempt({ source: 'assessment', exerciseId: ex.id, skill: sec.skill, correct: check.correct, score: check.score });
        nextQ();
      } }));
    };
    put(page, 
      h('div.test-head', h('span.step-kicker', `Section ${si} of ${a.sections.length} · ${sec.skill}`),
        h('div.bar', h('span', { style: { width: `${Math.round(((si - 1) / a.sections.length) * 100)}%` } }))),
      stimulus, h('section.card', slot));
    nextQ();
  }

  function speaking() {
    const sp = a.speaking;
    if (!sp) return finish();
    put(page, 
      h('div.test-head', h('span.step-kicker', 'Speaking task (not scored)')),
      h('section.card', h('p.lead', sp.instruction),
        recorder({ app, maxSeconds: 150, onRecorded: ({ seconds }) => P.logSpeaking({ lessonId: null, mode: 'free', seconds, check: level }) }),
        sp.checklist?.length ? h('fieldset.checklist', h('legend', 'Listen back. Did you…'), sp.checklist.map(c => h('label', h('input', { type: 'checkbox' }), ' ', c))) : null,
        h('div.ex-actions', button('See my result', finish, 'btn-primary'))));
  }

  async function finish() {
    const g = gradeLevelCheck(scores);
    await P.addLevelResult({ level, sectionScores: scores, passed: g.passed });
    const nl = nextLevel(level);
    if (g.passed && nl) {
      const unlocked = LEVEL_ORDER.indexOf(P.profile.unlockedLevel) < LEVEL_ORDER.indexOf(nl) ? nl : P.profile.unlockedLevel;
      await P.updateProfile({ unlockedLevel: unlocked, currentLevel: nl });
    }
    put(page, 
      h('header.page-head', h('h1', g.passed ? `${level} passed` : `Not yet — ${level}`)),
      h('section.card',
        h('table.result-table', h('tbody', Object.entries(scores).map(([k, v]) => h('tr', h('th', k), h('td', pct(v)), h('td', v >= SECTION_PASS ? '✓' : h('span.muted', 'below 70%')))))),
        g.passed
          ? h('p', nl ? `${nl} is now open, and it's your current level. Your ${level} items keep coming back in reviews.` : 'You have completed the final level.')
          : h('p', `Work on: ${g.weak.join(', ')}. Revisit the lessons for those skills and keep up your daily review, then try again.`)),
      h('div.ex-actions', h('a.btn.btn-primary', { href: g.passed ? '#/path' : '#/' }, g.passed ? 'Open the path' : 'Home')));
  }

  intro();
  return page;
}

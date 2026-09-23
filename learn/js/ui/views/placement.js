// Onboarding + placement test.
import { h, button, ar, add, put } from '../dom.js';
import * as placement from '../../engine/placement.js';
import { renderExercise } from '../exercises.js';
import { listeningPlayer } from '../components/listening.js';

export async function onboardingView(app) {
  const p = app.profile;
  let support = p.supportLang;
  const name = h('input.text-input', { type: 'text', value: p.name || '', placeholder: 'Your first name (optional)', autocomplete: 'given-name', 'aria-label': 'First name' });
  const supportRow = h('div.options.row',
    ['ar', 'none'].map(v => h(`button.option.inline${support === v ? '.selected' : ''}`, { type: 'button', on: { click: e => {
      support = v;
      e.currentTarget.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('selected', b === e.currentTarget));
    } } }, v === 'ar' ? 'Arabic help (عربي)' : 'English only')));

  async function begin(route, extra = {}) {
    await app.progress.updateProfile({ name: name.value.trim(), supportLang: support, ...extra });
    app.go(route);
  }

  return h('div.page.welcome',
    h('header.page-head', h('p.kicker', 'Learn English'), h('h1', 'Learn English you can actually use'),
      h('p.lead', 'Every lesson starts from a real situation. You listen, notice how the language works, practise, recall it from memory, use it in conversation — and it comes back later in new contexts so you keep it.'),
      h('p.ar-support', { dir: 'rtl', lang: 'ar' }, 'كل درس يبدأ بموقف حقيقي: تستمع، تلاحظ، تتدرب، تسترجع من الذاكرة، تستخدم اللغة في محادثة — ثم تعود إليك لاحقًا في سياقات جديدة حتى لا تنساها.')),
    h('ol.loop', ['Real language', 'Understand', 'Notice', 'Practise', 'Recall', 'Use', 'Feedback', 'Reuse later'].map(s => h('li', s))),
    h('section.card',
      h('h2', 'About you'),
      name,
      h('p.section-label', 'Explanations'),
      supportRow,
      h('p.muted.small', 'Arabic help appears under instructions and explanations up to B1. You can change this any time.')),
    h('section.card.choose',
      h('h2', 'Where should you start?'),
      h('div.choice-grid',
        h('div.choice',
          h('h3', 'I\'m a complete beginner'),
          h('p.muted', 'Start from zero at A0: greetings, names, numbers.'),
          h('p.ar-support', { dir: 'rtl', lang: 'ar' }, 'لا أعرف الإنجليزية تقريبًا — ابدأ من الصفر.'),
          button('Start at A0', () => begin('/', { onboarded: true, currentLevel: 'A0', unlockedLevel: 'A0' }), 'btn-ghost')),
        h('div.choice',
          h('h3', 'I know some English'),
          h('p.muted', 'Take a 10–15 minute placement test: grammar, vocabulary, reading and listening.'),
          h('p.ar-support', { dir: 'rtl', lang: 'ar' }, 'أعرف بعض الإنجليزية — اختبار تحديد المستوى.'),
          button('Take the placement test', () => begin('/placement'), 'btn-primary')))),
  );
}

export async function placementView(app) {
  const bank = await app.content.getPlacement();
  const wrap = h('div.page.placement');
  let st = null;

  function intro() {
    put(wrap, 
      h('header.page-head', h('p.kicker', 'Placement test'), h('h1', 'Find your starting level')),
      h('section.card',
        h('ul.plain',
          h('li', 'Four parts: grammar, vocabulary, reading and listening.'),
          h('li', 'Questions get harder when you answer well, easier when you don\'t — you won\'t see every level.'),
          h('li', 'No feedback during the test. Don\'t guess wildly: "I don\'t know" is useful information.'),
          h('li', h('strong', 'Speaking is not measured.'), ' Your result is an estimate for understanding and accuracy, not for speaking.')),
        ar('أربعة أجزاء: القواعد، المفردات، القراءة، الاستماع. لا يقيس هذا الاختبار مهارة التحدث.', app),
        h('div.ex-actions', button('Begin', () => { st = placement.create(bank, { start: 'A2' }); next(); }, 'btn-primary'))),
    );
  }

  function next() {
    if (placement.done(st)) return showResult();
    const q = placement.current(bank, st);
    const skillIdx = st.skills.indexOf(q.skill);
    const header = h('div.test-head',
      h('span.step-kicker', `Part ${skillIdx + 1} of ${st.skills.length} · ${cap(q.skill)}`),
      h('div.bar', h('span', { style: { width: `${Math.round((skillIdx / st.skills.length) * 100)}%` } })));
    let stimulus = null;
    if (q.text) stimulus = h('article.reading-text', q.text);
    if (q.script) {
      const player = listeningPlayer({ app, script: q.script, allowTranscript: false });
      app.onLeave(() => player.stop());
      stimulus = player.el;
    }
    const ex = { ...q.item, skill: q.skill };
    const exEl = renderExercise(ex, {
      app, mode: 'test',
      onDone: check => {
        app.progress.logAttempt({ source: 'placement', exerciseId: ex.id, skill: q.skill === 'listening' || q.skill === 'reading' ? q.skill : q.skill, correct: check.correct, score: check.score });
        st = placement.answer(bank, st, check.correct);
        next();
      },
    });
    const skip = button('I don\'t know', () => {
      st = placement.answer(bank, st, false);
      next();
    }, 'btn-ghost btn-sm');
    put(wrap, header, stimulus, h('section.card', exEl, h('div.skip-row', skip)));
  }

  function showResult() {
    const r = placement.result(st);
    const order = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'];
    const lower = order[Math.max(0, order.indexOf(r.overall) - 1)];
    const start = async level => {
      await app.progress.updateProfile({
        onboarded: true, currentLevel: level, unlockedLevel: r.overall,
        placement: { ...r, takenAt: Date.now() },
      });
      app.go('/');
    };
    put(wrap, 
      h('header.page-head', h('p.kicker', 'Placement result'), h('h1', `Estimated level: ${r.overall}`),
        h('p.muted', `Based on ${r.answered} questions. This is an estimate — lessons and level checks will refine it.`)),
      h('section.card',
        h('table.result-table', h('tbody', r.measured.map(s => h('tr', h('th', cap(s)), h('td', r.bySkill[s]),
          h('td.muted', r.strengths.includes(s) ? 'Strength' : r.weaknesses.includes(s) ? 'Needs work' : '')))),
          h('tr.muted', h('th', 'Speaking'), h('td', '—'), h('td', 'Not measured by this test'))),
        r.strengths.length ? h('p', h('strong', 'Strong: '), r.strengths.map(cap).join(', ')) : null,
        r.weaknesses.length ? h('p', h('strong', 'Needs work: '), r.weaknesses.map(cap).join(', '), '. Lessons at your level include this, and reviews will bring it back.') : null,
        h('p.muted.small', 'Speaking can\'t be judged by a test like this. The speaking tasks in each lesson will build it; if speaking feels hard, starting one level lower is a sensible choice.'),
        ar('هذا تقدير تقريبي. لم يتم قياس مهارة التحدث.', app)),
      h('div.ex-actions',
        r.overall !== 'A0' ? button(`Start one level lower (${lower})`, () => start(lower), 'btn-ghost') : null,
        button(`Start at ${r.overall}`, () => start(r.overall), 'btn-primary')),
    );
  }

  intro();
  return wrap;
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ════════════════════════════════════════════════════════════
// Lesson player — the core loop, one stage at a time:
// Situation → Listen → (Read) → Notice → Words → Pattern → Practice
// → Pronunciation → Recall → Speaking → Role-play → Summary.
// Every answer is evidence: it updates stage scores, the attempt log,
// and the review states of items the learner already knows.
// ════════════════════════════════════════════════════════════
import { h, icon, button, ar, pct, add, put } from '../dom.js';
import { stagesFor, PHASES, addScore, stageAverage, outcome, reviewItemsFor, SCORED_STAGES } from '../../engine/lesson.js';
import { taskOf } from '../../data/progress-repo.js';
import { renderExercise } from '../exercises.js';
import { listeningPlayer } from '../components/listening.js';
import { renderPronunciation } from '../components/pronunciation.js';
import { speakingTask } from '../components/speaking.js';
import { roleplayView } from '../components/roleplay.js';
import { speak, stopSpeaking } from '../speech.js';

export async function lessonView(app, id, query) {
  const lesson = await app.content.getLessonFull(id);
  const meta = lesson.meta;
  if (meta.level && !app.levelUnlocked(meta.level)) {
    return h('div.page.empty', h('h1', 'This lesson is locked'), h('p.muted', `Pass the level check before ${meta.level}, or take the placement test.`), h('a.btn.btn-primary', { href: '#/path' }, 'Learning path'));
  }
  const stages = stagesFor(lesson);
  const prev = app.progress.lessonProgress[id];
  const itemsById = app.data.itemsById;

  // Resume an unfinished run; otherwise start a fresh run (new evidence).
  const resume = prev?.status === 'in_progress';
  const s = {
    index: resume ? Math.min(prev.stage || 0, stages.length - 1) : 0,
    stageScores: resume ? { ...(prev.stageScores || {}) } : {},
    visited: new Set(resume ? prev.visited || [] : []),
    mistakes: [],
  };
  const jump = query?.get('stage');
  if (jump) { const k = stages.findIndex(x => x.key === jump); if (k >= 0) s.index = k; }

  const root = h('div.lesson');
  const head = h('header.lesson-head');
  const body = h('main.stage', { tabindex: -1 });
  add(root, head, body);
  let current = null; // cleanup handle of current stage

  app.onLeave(() => { current?.stop?.(); stopSpeaking(); });

  function persist() {
    const keepCompleted = prev?.status === 'completed' || prev?.status === 'revisit';
    app.progress.saveLessonProgress(id, {
      status: keepCompleted ? prev.status : 'in_progress',
      stage: s.index, stageScores: s.stageScores, visited: [...s.visited],
    });
  }

  function drawHead() {
    const st = stages[s.index];
    put(head, 
      h('div.lesson-top',
        h('a.icon-btn', { href: '#/path', 'aria-label': 'Back to learning path' }, icon('back')),
        h('div.lesson-title', h('span.muted.small', `${meta.level} · ${meta.topic || ''}`), h('strong', meta.title)),
        h('span.muted.small.stage-count', `${s.index + 1} / ${stages.length}`)),
      h('ol.stage-bar', { 'aria-label': 'Lesson stages' }, stages.map((x, i) => h(`li${i < s.index ? '.done' : i === s.index ? '.current' : ''}`, { title: x.label },
        h('button', { type: 'button', 'aria-label': `${x.label}${i === s.index ? ' (current)' : ''}`, disabled: !(s.visited.has(x.key) || i <= s.index), on: { click: () => go(i) } })))),
      h('p.phase', h('span.phase-name', st.phase), ' · ', st.label,
        h('span.phase-trail.muted', ` — ${PHASES.map(p => (p === st.phase ? p.toUpperCase() : p)).join(' · ')}`)),
    );
  }

  function go(i) {
    current?.stop?.();
    stopSpeaking();
    s.visited.add(stages[s.index].key);
    s.index = i;
    persist();
    draw();
  }
  const advance = () => go(Math.min(s.index + 1, stages.length - 1));

  // Evidence from one answer.
  function record(ex, check, stage, extra = {}) {
    s.stageScores = addScore(s.stageScores, stage, check.score ?? (check.correct ? 1 : 0));
    app.progress.logAttempt({
      lessonId: id, exerciseId: ex.id, itemIds: ex.items || [], skill: ex.skill || (stage === 'listen' ? 'listening' : 'vocabulary'),
      task: taskOf(ex.type), correct: !!check.correct, score: check.score, response: Array.isArray(extra.response) ? extra.response.join(',') : extra.response,
    });
    app.progress.applyLessonEvidence(ex.items, { correct: check.correct, near: check.near, type: ex.type, contextId: `lesson:${ex.id}` });
    if (!check.correct && check.feedback) s.mistakes.push({ prompt: ex.prompt, ...check.feedback });
    persist();
  }

  function continueBtn(label = 'Continue') {
    return h('div.ex-actions', button([label, icon('arrow')], advance, 'btn-primary'));
  }

  /** Exercises one at a time: "2 of 5". */
  function runExercises(list, stage, { hintable = false, intro = null, onComplete = advance } = {}) {
    const wrap = h('div.ex-run');
    let i = 0;
    const next = () => {
      if (i >= list.length) { onComplete(); return; }
      const ex = list[i];
      const n = ++i;
      put(wrap, 
        list.length > 1 ? h('p.ex-count.muted.small', `${n} of ${list.length}`) : null,
        renderExercise(ex, { app, hintable, onDone: (check, extra) => { record(ex, check, stage, extra); next(); } }),
      );
    };
    next();
    return h('div', intro, wrap);
  }

  // ── Stage renderers ──────────────────────────────────────
  const STAGES = {
    context() {
      const c = lesson.context;
      return h('div',
        h('p.kicker', 'The situation'),
        h('h2.situation', c.situation), ar(c.situation_ar, app),
        h('div.card.goal-card',
          h('p.section-label', 'Your goal'), h('p', c.goal), ar(c.goal_ar, app),
          meta.canDo?.length ? h('div', h('p.section-label', 'By the end you can'), h('ul.cando', meta.canDo.map(x => h('li', x)))) : null),
        h('p.muted.small', 'First you\'ll hear people in this situation. Aim to understand the message — not every word.'),
        continueBtn('Start listening'));
    },

    listen() {
      const inp = lesson.input;
      const video = inp.videoId ? app.data.videos.find(v => v.id === inp.videoId) : null;
      const script = inp.script?.length ? inp.script : video?.transcript || [];
      const vocab = [...(lesson.vocabulary || []), ...(lesson.recycle || [])].map(i => itemsById[i]).filter(Boolean);
      const player = listeningPlayer({ app, script, video, items: vocab, recycled: lesson.recycle || [], transcriptOpen: false });
      current = player;
      const wrap = h('div.listen.no-transcript');
      const task = h('div.listen-task');
      const phases = [
        ['gist', inp.gist, 'Listen for the main idea', 'Don\'t try to understand every word. Listen once or twice, then answer.', 'استمع للفكرة العامة. لا تحاول فهم كل كلمة.'],
        ['detail', inp.detail, 'Listen again for details', 'Now you can replay, slow down, and open the transcript if you need it.', 'استمع مرة أخرى للتفاصيل. يمكنك فتح النص الآن.'],
        ['inference', inp.inference, 'Read between the lines', 'The answer isn\'t said directly. What do the speakers mean?', 'الإجابة غير مذكورة مباشرة. ماذا يقصد المتحدثون؟'],
      ].filter(p => p[1]?.length);
      let k = 0;
      const nextPhase = () => {
        if (k >= phases.length) {
          player.showTranscript(true);
          put(task, h('p.muted', 'Tap the highlighted words in the transcript to see what they mean. Orange = met in an earlier lesson.'), continueBtn());
          return;
        }
        const [kind, list, title, sub, subAr] = phases[k++];
        if (kind !== 'gist') wrap.classList.remove('no-transcript');
        put(task, h('h3', title), h('p.muted', sub), ar(subAr, app),
          runExercises(list.map(q => ({ ...q, skill: 'listening' })), 'listen', { onComplete: nextPhase }));
      };
      nextPhase();
      add(wrap, h('p.kicker', inp.title || 'Listen'), player.el, task);
      return wrap;
    },

    read() {
      const r = lesson.reading;
      return h('div', h('p.kicker', 'Read'), h('h2', r.title || ''), h('article.reading-text', r.text),
        runExercises(r.questions.map(q => ({ ...q, skill: 'reading' })), 'read'));
    },

    notice() {
      const wrap = h('div');
      let k = 0;
      const nextNotice = () => {
        if (k >= lesson.notice.length) { advance(); return; }
        const n = lesson.notice[k++];
        const expl = h('div');
        const q = n.question
          ? renderExercise(n.question, { app, onDone: (check, extra) => {
            record(n.question, check, 'notice', extra);
            q.replaceWith(h('div.card.explain', h('p.section-label', 'Notice'), h('p', n.explain), ar(n.explain_ar, app), h('div.ex-actions', button(['Continue', icon('arrow')], nextNotice, 'btn-primary'))));
          } })
          : h('div.card.explain', h('p', n.explain), ar(n.explain_ar, app), h('div.ex-actions', button('Continue', nextNotice, 'btn-primary')));
        put(wrap, 
          h('p.kicker', `Notice ${lesson.notice.length > 1 ? `${k} of ${lesson.notice.length}` : ''}`),
          h('blockquote.quote', h('span.muted.small', 'You heard: '), h('span', n.quote),
            button([icon('speaker')], () => speak(n.quote.replace(/[…—]/g, ','), { rate: app.profile.speechRate }), 'icon-btn small', { 'aria-label': 'Listen' })),
          q, expl);
      };
      nextNotice();
      return wrap;
    },

    vocab() {
      const card = (item, recycled) => {
        const ctx = item.contexts?.find(c => c.lesson === id)?.sentence || item.example;
        return h(`article.word-card${recycled ? '.recycled' : ''}`,
          h('div.word-head',
            h('h3', item.form),
            button([icon('speaker')], () => speak(`${item.form}. ${ctx}`, { rate: app.profile.speechRate, audio: item.audio }), 'icon-btn', { 'aria-label': `Listen: ${item.form}` }),
            h('span.badge.badge-muted', item.kind.replace('-', ' '))),
          h('p', item.meaning), ar(item.meaning_ar, app),
          ctx ? h('p.word-ctx', h('span.muted.small', recycled ? 'In this lesson: ' : 'In context: '), ctx) : null,
          item.note ? h('p.muted.small', item.note) : null);
      };
      const items = (lesson.vocabulary || []).map(i => itemsById[i]).filter(Boolean).filter(i => i.kind !== 'grammar');
      const rec = (lesson.recycle || []).map(i => itemsById[i]).filter(Boolean).filter(i => i.kind !== 'grammar');
      return h('div',
        h('p.kicker', 'Words & phrases from the conversation'),
        h('p.muted', 'Learn them as chunks — the whole phrase, the way it was used.'),
        h('div.word-grid', items.map(i => card(i, false))),
        rec.length ? h('div', h('h3.sub', 'Seen before — now in a new context'), h('div.word-grid', rec.map(i => card(i, true)))) : null,
        continueBtn());
    },

    grammar() {
      const g = lesson.grammar;
      const reveal = h('div.pattern-reveal', { hidden: true },
        h('div.card.pattern', h('p.section-label', 'Pattern'), h('p.pattern-text', g.pattern)),
        h('p', g.explain), ar(g.explain_ar, app),
        h('ul.examples', (g.examples || []).map(e => h('li', e, button([icon('speaker')], () => speak(e, { rate: app.profile.speechRate }), 'icon-btn small', { 'aria-label': 'Listen' })))),
        continueBtn('Practise it'));
      const show = button('Show the pattern', () => { show.remove(); reveal.hidden = false; }, 'btn-ghost');
      return h('div',
        h('p.kicker', 'How it works'),
        h('h2', g.title || ''),
        h('blockquote.quote', h('span.muted.small', 'In context: '), g.context),
        h('p.muted', 'Look at the sentences above. What do you notice about the form? Think first, then check.'),
        show, reveal);
    },

    practice() {
      return runExercises(lesson.practice, 'practice', { intro: h('div', h('p.kicker', 'Guided practice'), h('p.muted', 'Different kinds of practice. Read the feedback — it matters more than the score.')) });
    },

    pronunciation() {
      const wrap = h('div');
      let k = 0;
      const nextBlock = () => {
        if (k >= lesson.pronunciation.length) { advance(); return; }
        const b = lesson.pronunciation[k++];
        const actions = h('div.ex-actions');
        const el = renderPronunciation(b, {
          app,
          score: (v, m) => record({ id: `${b.id}:${m?.word || m?.text || m?.sentence || ''}`, type: 'mcq', skill: 'pronunciation' }, { correct: v >= 0.999, near: v >= 0.5 && v < 1, score: v }, 'pronunciation'),
          logShadow: seconds => app.progress.logSpeaking({ lessonId: id, mode: 'shadowing', seconds }),
          onDone: () => put(actions, button(['Continue', icon('arrow')], nextBlock, 'btn-primary')),
        });
        put(wrap, h('p.kicker', `Pronunciation ${k} of ${lesson.pronunciation.length}`), el, actions);
      };
      nextBlock();
      return wrap;
    },

    retrieval() {
      return runExercises(lesson.retrieval, 'retrieval', {
        hintable: true,
        intro: h('div', h('p.kicker', 'Close the book'), h('p.muted', 'From memory — no options this time. Recalling is what makes it stick.'), ar('من الذاكرة — بدون خيارات. الاسترجاع هو ما يثبّت التعلم.', app)),
      });
    },

    speaking() {
      return h('div', h('p.kicker', 'Speaking'),
        speakingTask({
          app, speaking: lesson.speaking,
          log: (mode, seconds, skipped) => { if (!skipped) app.progress.logSpeaking({ lessonId: id, mode, seconds }); },
          onDone: advance,
        }));
    },

    interaction() {
      const rp = lesson.interaction;
      return h('div', h('p.kicker', 'Role-play'),
        roleplayView({
          app, rp,
          onFinish: (sum, first) => {
            if (first) {
              s.stageScores = addScore(s.stageScores, 'interaction', sum.total ? sum.achieved / sum.total : 0);
              for (const g of sum.goals) app.progress.logAttempt({ lessonId: id, exerciseId: `rp:${g.id}`, itemIds: [], skill: 'functional', task: 'production', correct: g.done, score: g.done ? 1 : 0 });
              persist();
            } else advance();
          },
        }));
    },

    summary() {
      s.visited.add('summary');
      const o = outcome(lesson, s.stageScores, [...s.visited]);
      const reviewIds = reviewItemsFor(lesson).filter(i => itemsById[i]);
      app.progress.introduce(reviewIds);
      const prevStatus = app.progress.lessonProgress[id]?.status;
      app.progress.saveLessonProgress(id, {
        status: prevStatus === 'completed' ? 'completed' : o.status,
        stage: 0, stageScores: s.stageScores, visited: [...s.visited], weak: o.weak, overall: o.overall,
        completedAt: Date.now(),
      });
      const ok = o.status === 'completed' || prevStatus === 'completed';
      const scored = stages.filter(x => SCORED_STAGES.includes(x.key));
      return h('div.summary',
        h('p.kicker', 'Lesson summary'),
        h('h2', ok ? 'Lesson complete' : 'Lesson finished — worth another look'),
        ok ? h('div.card.cando-card', h('p.section-label', 'What you can do now'), h('ul.cando', (meta.canDo || []).map(c => h('li', icon('check'), ' ', c))))
          : h('p', `Some stages were below 60% (${o.weak.join(', ')}). Your can-do statements are credited once they are stronger — you can redo just those stages from the stage bar.`),
        h('table.result-table', h('tbody', scored.map(x => {
          const avg = stageAverage(s.stageScores, x.key);
          return h('tr', h('th', x.label), h('td', pct(avg)), h('td.muted', avg == null ? 'not answered' : avg >= 0.6 ? '' : 'revisit'));
        }))),
        s.mistakes.length ? h('div.card', h('p.section-label', 'Worth remembering'),
          s.mistakes.slice(0, 6).map(m => h('div.mistake',
            m.yourAnswer != null ? h('p', h('span.your', String(m.yourAnswer)), ' → ', h('span.better', m.better || '')) : null,
            m.why ? h('p.muted.small', m.why) : null))) : null,
        h('div.card', h('p.section-label', 'Spaced review'),
          h('p', `${reviewIds.length} words, phrases and patterns from this lesson are now in your review. The first review comes in about 20 minutes, then tomorrow, then at growing intervals — in new sentences each time.`)),
        h('div.ex-actions', h('a.btn.btn-ghost', { href: '#/path' }, 'Learning path'), h('a.btn.btn-primary', { href: '#/' }, 'Done')));
    },
  };

  function draw() {
    drawHead();
    current = null;
    const st = stages[s.index];
    put(body, STAGES[st.key]());
    body.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  persist();
  draw();
  return root;
}

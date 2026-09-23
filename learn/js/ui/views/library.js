// Libraries — the same content, entered by skill. Not separate apps:
// every entry leads back into a lesson stage, a video lesson, or the
// learner's own items and their contexts.
import { h, icon, button, ar, relTime, add, put } from '../dom.js';
import { lessonsOfLevel, LEVEL_ORDER } from '../../engine/progress.js';
import { speak } from '../speech.js';
import { listeningPlayer } from '../components/listening.js';
import { renderExercise } from '../exercises.js';

const TITLES = { listening: 'Listening', speaking: 'Speaking', vocabulary: 'Vocabulary', grammar: 'Grammar' };
const STAGE_LABEL = { learning: 'Learning', review: 'Review', mastered: 'Mastered' };

export async function libraryView(app, skill) {
  const page = h('div.page.library', h('header.page-head', h('h1', TITLES[skill])));
  add(page, await LIB[skill](app));
  return page;
}

function openLevels(app) {
  return LEVEL_ORDER.filter(l => app.levelUnlocked(l));
}

const LIB = {
  async listening(app) {
    const levels = openLevels(app);
    const videos = app.data.videos.filter(v => levels.includes(v.level)).sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) || (a.difficulty || 0) - (b.difficulty || 0));
    const lessons = levels.flatMap(l => lessonsOfLevel(app.data.catalog, l).map(x => ({ ...x, level: l })));
    return h('div',
      h('section',
        h('h2.sub', 'Videos'),
        videos.length ? h('ul.list', videos.map(v => h('li', h('a.list-link', { href: `#/video/${v.id}` },
          h('span.level-code.small', v.level),
          h('span.lesson-text', h('span.lesson-title', v.title), h('span.muted.small', [v.topic, v.duration, v.difficulty ? `difficulty ${v.difficulty}/5` : null].filter(Boolean).join(' · '))),
          icon('arrow')))))
          : h('p.muted', 'Videos appear here when your teacher adds them. Each one is chosen and levelled by a person, not by an algorithm.')),
      h('section',
        h('h2.sub', 'Lesson conversations'),
        h('ul.list', lessons.map(l => h('li', h('a.list-link', { href: `#/lesson/${l.id}?stage=listen` },
          h('span.level-code.small', l.level), h('span.lesson-text', h('span.lesson-title', l.title), h('span.muted.small', l.topic)), icon('arrow')))))));
  },

  async speaking(app) {
    const levels = openLevels(app);
    const logs = app.progress.speakingLogs;
    const lessons = levels.flatMap(l => lessonsOfLevel(app.data.catalog, l).map(x => ({ ...x, level: l })));
    return h('div',
      h('p.muted', 'Speaking tasks and role-plays from your lessons. Repeat them — fluency grows with repetition.'),
      h('ul.list', lessons.flatMap(l => {
        const n = logs.filter(s => s.lessonId === l.id && s.mode !== 'shadowing').length;
        return [
          h('li', h('a.list-link', { href: `#/lesson/${l.id}?stage=speaking` }, h('span.level-code.small', l.level),
            h('span.lesson-text', h('span.lesson-title', `Speaking: ${l.title}`), h('span.muted.small', n ? `Practised ${n} time${n === 1 ? '' : 's'}` : 'Not practised yet')), icon('arrow'))),
          h('li', h('a.list-link', { href: `#/lesson/${l.id}?stage=interaction` }, h('span.level-code.small', l.level),
            h('span.lesson-text', h('span.lesson-title', `Role-play: ${l.topic}`), h('span.muted.small', 'Reach the goals of the conversation')), icon('arrow'))),
        ];
      })));
  },

  async vocabulary(app) {
    const states = app.progress.states.filter(s => s.stage !== 'new' && app.data.itemsById[s.itemId] && app.data.itemsById[s.itemId].kind !== 'grammar');
    if (!states.length) return h('p.muted', 'Words and phrases appear here after your first lesson.');
    const search = h('input.text-input', { type: 'search', placeholder: 'Search your words and phrases', 'aria-label': 'Search' });
    const listWrap = h('div');
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      put(listWrap, ...Object.keys(STAGE_LABEL).map(stage => {
        const list = states.filter(s => s.stage === stage).map(s => ({ s, item: app.data.itemsById[s.itemId] }))
          .filter(x => !q || x.item.form.toLowerCase().includes(q) || x.item.meaning.toLowerCase().includes(q))
          .sort((a, b) => a.s.due - b.s.due);
        if (!list.length) return null;
        return h('section', h('h2.sub', `${STAGE_LABEL[stage]} (${list.length})`),
          h('ul.list', list.map(({ s, item }) => h('li', h('a.list-link', { href: `#/item/${item.id}` },
            h('span.lesson-text', h('span.lesson-title', item.form), h('span.muted.small', item.meaning)),
            h('span.muted.small', `review ${relTime(s.due)}`), icon('arrow'))))));
      }));
    };
    search.addEventListener('input', draw);
    draw();
    return h('div', h('p.muted', 'Learning → Review → Mastered. Mastered takes several correct reviews over weeks, in different sentences, including one of your own.'), search, listWrap);
  },

  async grammar(app) {
    const levels = openLevels(app);
    const lessons = app.data.catalog.lessons;
    const bodies = await Promise.all(levels.flatMap(l => lessonsOfLevel(app.data.catalog, l)).map(async l => {
      try { return { meta: l, body: await app.content.getLesson(l.id) }; } catch { return null; }
    }));
    const rows = bodies.filter(x => x?.body.grammar).map(({ meta, body }) => {
      const item = app.data.itemsById[body.grammar.item];
      const st = item ? app.progress.state(item.id) : null;
      return h('li', h('a.list-link', { href: `#/lesson/${meta.id}?stage=grammar` },
        h('span.lesson-text', h('span.lesson-title', body.grammar.title || item?.form), h('span.muted.small', body.grammar.pattern)),
        h('span.badge.badge-muted', st && st.stage !== 'new' ? STAGE_LABEL[st.stage] : 'Not met yet'), icon('arrow')));
    });
    return h('div', h('p.muted', 'Each pattern links back to the conversation where you met it: context first, then the pattern.'),
      rows.length ? h('ul.list', rows) : h('p.muted', `No grammar patterns in your open levels yet (${lessons.length} lessons in the course).`));
  },
};

export async function itemView(app, itemId) {
  const item = app.data.itemsById[itemId];
  if (!item) return h('div.page.empty', h('h1', 'Not found'));
  const st = app.progress.state(itemId);
  const lessonTitle = lid => app.data.catalog.lessons.find(l => l.id === lid)?.title;
  const seen = new Set(st?.contexts || []);
  return h('div.page',
    h('header.page-head', h('a.icon-btn', { href: '#/library/vocabulary', 'aria-label': 'Back' }, icon('back')), h('h1', item.form),
      button([icon('speaker'), ' Listen'], () => speak(item.example || item.form, { rate: app.profile.speechRate, audio: item.audio }), 'btn-ghost btn-sm')),
    h('section.card',
      h('p', item.meaning), ar(item.meaning_ar, app),
      item.note ? h('p.muted', item.note) : null,
      st ? h('p.muted.small', `Stage: ${STAGE_LABEL[st.stage] || 'New'} · next review ${relTime(st.due)} · ${st.lapses} lapse${st.lapses === 1 ? '' : 's'}`) : null),
    h('section.card',
      h('h2', 'In context'),
      h('p.muted.small', 'The same language in different lessons and levels. Reviews use a new one each time.'),
      h('ul.contexts', (item.contexts || []).map(c => h(`li${seen.has(c.id) ? '.seen' : ''}`,
        h('p', c.sentence), c.lesson ? h('p.muted.small', lessonTitle(c.lesson) || c.lesson) : null)))));
}

export async function videoView(app, videoId) {
  const v = app.data.videos.find(x => x.id === videoId);
  if (!v) return h('div.page.empty', h('h1', 'Video not found'), h('a', { href: '#/library/listening' }, 'Back'));
  const items = [...(v.vocabulary || []), ...(v.expressions || []), ...(v.grammar || [])].map(i => app.data.itemsById[i]).filter(Boolean);
  const player = listeningPlayer({ app, script: v.transcript || [], video: v, items, allowTranscript: !!v.transcript?.length });
  app.onLeave(() => player.stop());
  const qs = (v.questions || []).map(q => ({ ...q, skill: 'listening' }));
  const task = h('div');
  let i = 0;
  const next = () => {
    if (i >= qs.length) {
      put(task, 
        items.length ? h('div.card', h('p.section-label', 'Language from this video'), h('ul.chips', items.map(it => h('li.chip', it.form))),
          button('Add these to my review', async e => { await app.progress.introduce(items.map(x => x.id)); e.currentTarget.replaceWith(h('p.muted', 'Added — they will come back in your daily review.')); }, 'btn-primary btn-sm')) : null,
        h('a.btn.btn-ghost', { href: '#/library/listening' }, 'More listening'));
      return;
    }
    const q = qs[i++];
    put(task, h('p.ex-count.muted.small', `${i} of ${qs.length}`), renderExercise(q, { app, onDone: check => {
      app.progress.logAttempt({ source: 'video', exerciseId: `${v.id}:${q.id || i}`, itemIds: q.items || [], skill: 'listening', task: 'recognition', correct: check.correct, score: check.score });
      next();
    } }));
  };
  next();
  return h('div.page',
    h('header.page-head', h('a.icon-btn', { href: '#/library/listening', 'aria-label': 'Back' }, icon('back')),
      h('div', h('p.kicker', `${v.level} · ${v.topic}`), h('h1', v.title))),
    h('p.muted', 'Watch for the main message first. Replay as often as you like; open the transcript only when you need it.'),
    player.el,
    qs.length ? h('h3', 'Check your understanding') : null,
    task);
}

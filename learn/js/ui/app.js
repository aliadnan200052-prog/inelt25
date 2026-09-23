// ════════════════════════════════════════════════════════════
// Learn English — student app bootstrap and router.
// ════════════════════════════════════════════════════════════
import { LocalContentRepository } from '../data/content-repo.js';
import { LocalProgressRepository } from '../data/progress-repo.js';
import { LEVEL_ORDER } from '../engine/progress.js';
import { dueQueue } from '../engine/srs.js';
import { h, mount, icon } from './dom.js';
import { stopSpeaking } from './speech.js';

import { homeView } from './views/home.js';
import { pathView } from './views/path.js';
import { onboardingView, placementView } from './views/placement.js';
import { lessonView } from './views/lesson.js';
import { reviewView } from './views/review.js';
import { progressView } from './views/progress.js';
import { libraryView, itemView, videoView } from './views/library.js';
import { levelCheckView } from './views/check.js';
import { settingsView } from './views/settings.js';

const ROUTES = [
  [/^\/?$/, homeView],
  [/^\/welcome$/, onboardingView],
  [/^\/placement$/, placementView],
  [/^\/path$/, pathView],
  [/^\/lesson\/([\w-]+)$/, lessonView, { focus: true }],
  [/^\/review$/, reviewView, { focus: true }],
  [/^\/progress$/, progressView],
  [/^\/library\/(listening|speaking|vocabulary|grammar)$/, libraryView],
  [/^\/item\/([\w-]+)$/, itemView],
  [/^\/video\/([\w-]+)$/, videoView, { focus: true }],
  [/^\/check\/(A0|A1|A2|B1|B2|C1)$/, levelCheckView, { focus: true }],
  [/^\/settings$/, settingsView],
];

const app = {
  content: new LocalContentRepository(),
  progress: new LocalProgressRepository(),
  data: null,
  cleanups: [],
  get profile() { return this.progress.profile; },
  /** Arabic support is shown up to B1 when the learner wants it. */
  get support() {
    const p = this.progress.profile;
    return p.supportLang === 'ar' && LEVEL_ORDER.indexOf(p.currentLevel) <= LEVEL_ORDER.indexOf('B1');
  },
  onLeave(fn) { this.cleanups.push(fn); },
  go(path) { location.hash = '#' + path; },
  async reload() {
    const [catalog, items, videos, schedules] = await Promise.all([
      this.content.getCatalog(), this.content.getItems(), this.content.getVideos(), this.content.getSchedules(),
    ]);
    this.data = { catalog, items, itemsById: Object.fromEntries(items.map(i => [i.id, i])), videos, schedules };
  },
  forced() { return this.progress.forcedItems(this.data.schedules); },
  dueCount(now = Date.now()) {
    return dueQueue(this.progress.states.filter(s => this.data.itemsById[s.itemId]), now, { limit: 999, forced: this.forced() }).length;
  },
  levelUnlocked(level) {
    return LEVEL_ORDER.indexOf(level) <= LEVEL_ORDER.indexOf(this.progress.profile.unlockedLevel);
  },
};

const view = document.getElementById('view');
const nav = document.getElementById('nav');

function drawNav(path) {
  const due = app.data ? app.dueCount() : 0;
  const links = [
    ['/', 'Home', 'home'], ['/path', 'Path', 'path'],
    ['/review', 'Review', 'review', due], ['/progress', 'Progress', 'chart'],
  ];
  mount(nav, links.map(([p, label, ic, badge]) => h('a.nav-link', {
    href: '#' + p, 'aria-current': (p === '/' ? path === '/' || path === '' : path.startsWith(p)) ? 'page' : null,
  }, icon(ic), h('span', label), badge ? h('span.nav-badge', { 'aria-label': `${badge} due` }, String(badge)) : null)));
  const lvl = document.getElementById('level-chip');
  if (lvl) lvl.textContent = app.progress.profile.onboarded ? app.progress.profile.currentLevel : '';
}

let renderToken = 0;

async function render() {
  const token = ++renderToken;
  for (const fn of app.cleanups.splice(0)) { try { fn(); } catch { /* ignore */ } }
  stopSpeaking();
  const path = decodeURIComponent(location.hash.replace(/^#/, '').split('?')[0]) || '/';
  const query = new URLSearchParams(location.hash.split('?')[1] || '');

  if (!app.progress.profile.onboarded && !/^\/(welcome|placement|settings)$/.test(path)) {
    app.go('/welcome');
    return;
  }

  const match = ROUTES.map(([re, fn, opts]) => ({ m: path.match(re), fn, opts })).find(r => r.m);
  document.body.classList.toggle('focus-mode', !!match?.opts?.focus);
  drawNav(path);
  if (!match) { mount(view, h('div.empty', h('h1', 'Page not found'), h('a', { href: '#/' }, 'Go home'))); return; }
  mount(view, h('div.loading', { 'aria-busy': 'true' }, h('div.skeleton.sk-title'), h('div.skeleton.sk-card')));
  try {
    const el = await match.fn(app, ...match.m.slice(1), query);
    if (token !== renderToken) return; // the learner navigated away while this view loaded
    mount(view, el);
    view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } catch (e) {
    console.error(e);
    mount(view, h('div.empty', h('h1', 'Something went wrong'), h('p.muted', String(e.message || e)), h('a.btn.btn-primary', { href: '#/' }, 'Home')));
  }
}

function applyTheme() {
  const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

async function start() {
  applyTheme();
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  try {
    await app.reload();
  } catch (e) {
    mount(view, h('div.empty', h('h1', 'Could not load the course'), h('p.muted', String(e.message || e))));
    return;
  }
  app.progress.onChange(() => drawNav(decodeURIComponent(location.hash.replace(/^#/, '').split('?')[0]) || '/'));
  window.addEventListener('hashchange', render);
  render();
}

start();

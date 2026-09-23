import { h, button, add, put } from '../dom.js';
import { canRecognise } from '../speech.js';

export async function settingsView(app) {
  const p = app.profile;
  const support = h('select.text-input', { 'aria-label': 'Support language', on: { change: e => app.progress.updateProfile({ supportLang: e.target.value }) } },
    h('option', { value: 'ar', selected: p.supportLang === 'ar' }, 'Arabic help up to B1'),
    h('option', { value: 'none', selected: p.supportLang === 'none' }, 'English only'));
  const rate = h('select.text-input', { 'aria-label': 'Speech speed', on: { change: e => app.progress.updateProfile({ speechRate: Number(e.target.value) }) } },
    [[0.8, 'Slow'], [0.95, 'Natural (slightly slow)'], [1.05, 'Fast']].map(([v, l]) => h('option', { value: v, selected: Math.abs((p.speechRate || 0.95) - v) < 0.01 }, l)));
  const recog = canRecognise()
    ? h('label.toggle', h('input', { type: 'checkbox', checked: !!p.useRecognition, on: { change: e => app.progress.updateProfile({ useRecognition: e.target.checked }) } }),
      ' Use speech recognition to type what I say (role-plays, pronunciation checks)')
    : h('p.muted.small', 'Speech recognition isn\'t available in this browser. You can still record and listen back.');

  return h('div.page',
    h('header.page-head', h('h1', 'Settings')),
    h('section.card.form',
      h('label', 'Explanations', support),
      h('label', 'Speech speed', rate),
      recog,
      h('p.muted.small', 'Speech recognition is provided by your browser; in some browsers audio is sent to the browser maker\'s service. Your recordings are never uploaded by this app.')),
    h('section.card',
      h('h2', 'Your data'),
      h('p.muted', 'Your progress is stored in this browser only.'),
      h('div.ex-actions',
        button('Download my progress', () => {
          const blob = new Blob([app.progress.exportJSON()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: 'learn-english-progress.json' });
          add(document.body, a); a.click(); a.remove();
        }, 'btn-ghost'),
        button('Retake the placement test', () => app.go('/placement'), 'btn-ghost'),
        button('Reset all progress', async () => {
          if (confirm('Delete all your progress in this browser? This cannot be undone.')) { await app.progress.reset(); app.go('/welcome'); }
        }, 'btn-danger'))),
  );
}

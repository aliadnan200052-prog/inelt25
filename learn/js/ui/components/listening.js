// Listening player: YouTube (if the admin attached a video) or the
// script read by speech synthesis. Transcript can be shown/hidden;
// the lesson's words and phrases are highlighted inside it.
import { h, icon, button, ar, add, put } from '../dom.js';
import { playScript, stopSpeaking, speak } from '../speech.js';
import { youtubePlayer } from '../youtube.js';

export function listeningPlayer({ app, script = [], video = null, items = [], recycled = [], transcriptOpen = false, allowTranscript = true }) {
  const rate = () => app.progress.profile.speechRate || 0.95;
  let slow = false;
  let ctrl = null;
  let yt = null;
  const lines = [];
  const status = h('p.player-status.muted', { 'aria-live': 'polite' }, script.length ? `${script.length} lines · ${speakers(script).join(', ')}` : '');
  const transcript = h('div.transcript', { hidden: !transcriptOpen });
  const popover = h('div.item-pop', { hidden: true });
  const recycledSet = new Set(recycled);

  script.forEach((line, i) => {
    const row = h('p.t-line', { dataset: { i } },
      line.s ? h('span.t-speaker', line.s) : null,
      h('span.t-text', highlight(line.t, items, recycledSet, showItem)));
    row.addEventListener('click', e => {
      if (e.target.closest('mark')) return;
      if (yt && line.time != null) yt.seek(line.time);
      else if (!yt) speak(line.t, { speaker: line.s, rate: rate() });
    });
    lines.push(row);
    add(transcript, row);
  });

  function setActive(i) {
    lines.forEach((l, k) => l.classList.toggle('active', k === i));
    if (i >= 0) status.textContent = `${script[i].s || 'Speaker'} is speaking…`;
  }

  function showItem(item) {
    popover.hidden = false;
    put(popover, 
      h('div.pop-head', h('strong', item.form), button([icon('speaker')], () => speak(item.example || item.form, { rate: rate(), audio: item.audio }), 'icon-btn', { 'aria-label': 'Listen' })),
      h('p', item.meaning),
      ar(item.meaning_ar, app),
      item.example ? h('p.muted', h('em', item.example)) : null,
      recycledSet.has(item.id) ? h('span.badge.badge-muted', 'Seen in an earlier lesson') : null,
      button('Close', () => { popover.hidden = true; }, 'btn-ghost btn-sm'),
    );
  }

  const controls = h('div.player-controls');
  let media;
  if (video?.youtubeId) {
    yt = youtubePlayer(video.youtubeId, {
      onTime: t => {
        let idx = -1;
        script.forEach((l, i) => { if (l.time != null && l.time <= t) idx = i; });
        if (idx >= 0) lines.forEach((l, k) => l.classList.toggle('active', k === idx));
      },
    });
    media = yt.el;
    add(controls, 
      button([icon('play'), ' Play'], () => yt.play(), 'btn-primary btn-sm'),
      button([icon('pause'), ' Pause'], () => yt.pause(), 'btn-ghost btn-sm'),
      button([icon('replay'), ' Back 5 s'], () => yt.back(5), 'btn-ghost btn-sm'),
      speedToggle(v => yt.setRate(v ? 0.75 : 1)),
    );
  } else {
    media = h('div.audio-card', h('div.audio-wave', { 'aria-hidden': 'true' }, Array.from({ length: 24 }, () => h('span'))), status);
    const playBtn = button([icon('play'), ' Play'], () => start(0), 'btn-primary btn-sm');
    const stopBtn = button([icon('pause'), ' Stop'], () => { ctrl?.stop(); media.classList.remove('playing'); }, 'btn-ghost btn-sm');
    add(controls, playBtn, stopBtn, speedToggle(v => { slow = v; }));
    function start(from) {
      ctrl?.stop();
      media.classList.add('playing');
      ctrl = playScript(script, {
        rate: slow ? Math.max(0.6, rate() - 0.25) : rate(), from,
        onLine: setActive,
        onEnd: () => { media.classList.remove('playing'); status.textContent = 'Finished. Play again as many times as you like.'; setActive(-1); },
      });
    }
  }

  const toggle = allowTranscript ? button(transcriptOpen ? 'Hide transcript' : 'Show transcript', () => {
    transcript.hidden = !transcript.hidden;
    toggle.textContent = transcript.hidden ? 'Show transcript' : 'Hide transcript';
  }, 'btn-ghost btn-sm') : null;
  if (toggle) add(controls, toggle);

  const el = h('div.player', media, controls, transcript, popover);
  return {
    el,
    stop() { ctrl?.stop(); stopSpeaking(); yt?.pause(); yt?.destroy(); },
    showTranscript(v = true) { transcript.hidden = !v; if (toggle) toggle.textContent = v ? 'Hide transcript' : 'Show transcript'; },
  };
}

function speedToggle(onChange) {
  let on = false;
  const b = button('Normal speed', () => { on = !on; b.textContent = on ? 'Slower' : 'Normal speed'; b.setAttribute('aria-pressed', on); onChange(on); }, 'btn-ghost btn-sm', { 'aria-pressed': 'false' });
  return b;
}

function speakers(script) {
  return [...new Set(script.map(l => l.s).filter(Boolean))];
}

/** Split text into plain spans and <mark>s for learning items (non-overlapping). */
export function highlight(text, items, recycledSet = new Set(), onClick) {
  const hits = [];
  for (const item of items) {
    if (item.kind === 'grammar') continue;
    for (const p of item.match || []) {
      let re;
      try { re = new RegExp(p, 'gi'); } catch { continue; }
      for (const m of text.matchAll(re)) {
        if (!m[0].trim()) continue;
        let end = m.index + m[0].length;
        while (end < text.length && /[\p{L}']/u.test(text[end])) end++; // finish the word
        hits.push({ start: m.index, end, item });
      }
    }
  }
  hits.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const out = [];
  let pos = 0;
  for (const hit of hits) {
    if (hit.start < pos) continue;
    if (hit.start > pos) out.push(text.slice(pos, hit.start));
    const mark = h(`mark.hl${recycledSet.has(hit.item.id) ? '.recycled' : ''}`, { tabindex: 0, role: 'button', title: hit.item.meaning }, text.slice(hit.start, hit.end));
    mark.addEventListener('click', () => onClick?.(hit.item));
    mark.addEventListener('keydown', e => { if (e.key === 'Enter') onClick?.(hit.item); });
    out.push(mark);
    pos = hit.end;
  }
  if (pos < text.length) out.push(text.slice(pos));
  return out;
}

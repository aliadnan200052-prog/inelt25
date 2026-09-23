// ════════════════════════════════════════════════════════════
// YouTube embed controlled over postMessage (the protocol the
// official IFrame API uses) — no third-party script on the page.
// Uses youtube-nocookie.com. Levels are set by the admin, never
// read from YouTube.
// ════════════════════════════════════════════════════════════
import { h } from './dom.js';

const ORIGIN = 'https://www.youtube-nocookie.com';

export function youtubePlayer(videoId, { onTime } = {}) {
  const src = `${ORIGIN}/embed/${encodeURIComponent(videoId)}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1&origin=${encodeURIComponent(location.origin)}`;
  const frame = h('iframe', {
    src, title: 'Video player', allow: 'encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true,
    referrerpolicy: 'strict-origin-when-cross-origin', loading: 'lazy',
  });
  let time = 0;
  const send = (func, args = []) => frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), ORIGIN);

  function onMessage(e) {
    if (e.origin !== ORIGIN || e.source !== frame.contentWindow) return;
    let data;
    try { data = JSON.parse(e.data); } catch { return; }
    const t = data?.info?.currentTime;
    if (typeof t === 'number') { time = t; onTime?.(t); }
  }
  window.addEventListener('message', onMessage);
  frame.addEventListener('load', () => {
    frame.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: videoId }), ORIGIN);
  });

  return {
    el: h('div.video-frame', frame),
    play: () => send('playVideo'),
    pause: () => send('pauseVideo'),
    seek: s => { send('seekTo', [s, true]); send('playVideo'); },
    back: (n = 5) => { send('seekTo', [Math.max(0, time - n), true]); send('playVideo'); },
    setRate: r => send('setPlaybackRate', [r]),
    destroy: () => window.removeEventListener('message', onMessage),
  };
}

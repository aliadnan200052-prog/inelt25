// ════════════════════════════════════════════════════════════
// Audio: speech synthesis for scripts without a recording,
// microphone recording (kept in memory only, never uploaded),
// and optional browser speech recognition.
// ════════════════════════════════════════════════════════════

let voices = [];
function loadVoices() {
  if (!('speechSynthesis' in window)) return [];
  voices = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
  // Prefer natural/local UK & US voices first.
  voices.sort((a, b) => score(b) - score(a));
  return voices;
}
function score(v) {
  let s = 0;
  if (/natural|neural|premium|enhanced/i.test(v.name)) s += 4;
  if (/en[-_](GB|US)/i.test(v.lang)) s += 2;
  if (v.localService) s += 1;
  return s;
}
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

export const canSpeak = () => 'speechSynthesis' in window;

function voiceFor(speaker) {
  if (!voices.length) loadVoices();
  if (!voices.length) return null;
  if (!speaker) return voices[0];
  let hsh = 0;
  for (const c of speaker) hsh = (hsh * 31 + c.charCodeAt(0)) >>> 0;
  return voices[hsh % Math.min(voices.length, 4)];
}

export function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
}

/** Speak one text. Resolves when finished (or immediately if unsupported). */
export function speak(text, { speaker, rate = 0.95, audio } = {}) {
  if (audio) {
    return new Promise(resolve => {
      const a = new Audio(audio);
      a.onended = resolve; a.onerror = resolve;
      a.play().catch(resolve);
    });
  }
  if (!canSpeak()) return Promise.resolve();
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(speaker);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
    u.rate = rate;
    // Slight pitch difference so two speakers sharing a voice stay distinct.
    if (speaker) u.pitch = 0.9 + ((speaker.length % 3) * 0.1);
    // Some browsers never fire `end` (no voices installed, tab in background):
    // never let a script stall on one line.
    const words = String(text).split(/\s+/).length;
    const guard = setTimeout(resolve, 2500 + (words * 520) / rate);
    const done = () => { clearTimeout(guard); resolve(); };
    u.onend = done; u.onerror = done;
    speechSynthesis.speak(u);
  });
}

/**
 * Play a script line by line. onLine(i) is called as each line starts.
 * Returns a controller { stop() }.
 */
export function playScript(lines, { rate, onLine, onEnd, from = 0 } = {}) {
  let stopped = false;
  (async () => {
    for (let i = from; i < lines.length && !stopped; i++) {
      onLine?.(i);
      await speak(lines[i].t, { speaker: lines[i].s, rate, audio: lines[i].audio });
      if (!stopped) await new Promise(r => setTimeout(r, 250));
    }
    if (!stopped) onEnd?.();
  })();
  return { stop() { stopped = true; stopSpeaking(); onLine?.(-1); } };
}

// ── Recording ───────────────────────────────────────────────
export const canRecord = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  const started = Date.now();
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.start();
  return {
    stop: () => new Promise(resolve => {
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
        resolve({ url: URL.createObjectURL(blob), seconds: Math.round((Date.now() - started) / 1000) });
      };
      rec.stop();
    }),
    cancel: () => { try { rec.stop(); } catch { /* already stopped */ } stream.getTracks().forEach(t => t.stop()); },
  };
}

// ── Recognition (optional, browser service) ─────────────────
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canRecognise = () => !!Recognition;

/** Listen once and resolve with the transcript ('' if nothing heard). */
export function recogniseOnce({ lang = 'en-GB' } = {}) {
  return new Promise((resolve, reject) => {
    if (!Recognition) return reject(new Error('unsupported'));
    const r = new Recognition();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 1;
    let text = '';
    r.onresult = e => { text = Array.from(e.results).map(x => x[0].transcript).join(' '); };
    r.onerror = e => (e.error === 'no-speech' ? resolve('') : reject(e));
    r.onend = () => resolve(text);
    r.start();
  });
}

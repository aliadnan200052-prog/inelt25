import type { Playback, Recording, SpeechService, TextToSpeechOptions } from "./types";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Simulated mic: produces a speech-like level curve (syllable bumps on a
 * slow envelope) so the waveform feels alive without asking for mic access.
 */
function mockRecording(): Recording {
  const t0 = performance.now();
  let stopped = false;
  return {
    level() {
      if (stopped) return 0;
      const t = (performance.now() - t0) / 1000;
      const attack = Math.min(1, t * 3);
      const envelope = 0.55 + 0.35 * Math.sin(t * 1.7);
      const syllables = Math.abs(Math.sin(t * 9.3)) * 0.6 + Math.abs(Math.sin(t * 4.1 + 1)) * 0.4;
      const jitter = Math.random() * 0.15;
      return Math.min(1, attack * (envelope * syllables + jitter));
    },
    async stop() {
      stopped = true;
      return null;
    },
    cancel() {
      stopped = true;
    },
  };
}

/** Time a line would take to say aloud; used when real TTS can't play. */
const estimateMs = (text: string, rate = 1) => Math.max(900, text.length * 62) / rate;

function simulatedSpeech(text: string, rate?: number): Playback {
  let cancel = () => {};
  const finished = new Promise<void>((resolve) => {
    const id = setTimeout(resolve, estimateMs(text, rate));
    cancel = () => {
      clearTimeout(id);
      resolve();
    };
  });
  return { finished, stop: () => cancel() };
}

/** Uses the browser's built-in speech synthesis when available (free, offline). */
function browserTextToSpeech(text: string, opts: TextToSpeechOptions = {}): Playback {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth) return simulatedSpeech(text, opts.rate);

  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.lang ?? "en-GB";
  u.rate = opts.rate ?? 1;
  u.pitch = opts.pitch ?? 1;
  const voices = synth.getVoices();
  const preferred =
    opts.preferredVoices?.map((n) => voices.find((v) => v.name === n)).find(Boolean) ??
    voices.find((v) => v.lang === u.lang) ??
    voices.find((v) => v.lang.startsWith("en"));
  if (preferred) u.voice = preferred;
  if (opts.onBoundary) u.onboundary = (e) => opts.onBoundary?.(e.charIndex);

  let stopped = false;
  let fallback: Playback | null = null;
  const finished = new Promise<void>((resolve) => {
    u.onend = () => resolve();
    // No usable voice (common on fresh installs): keep the pacing anyway,
    // so captions and progress still read naturally.
    u.onerror = (e) => {
      if (stopped || e.error === "interrupted" || e.error === "canceled") return resolve();
      fallback = simulatedSpeech(text, u.rate);
      fallback.finished.then(resolve);
    };
    // Some engines never fire onend; don't hang the UI.
    setTimeout(resolve, 2000 + estimateMs(text, u.rate) * 2);
  });
  synth.speak(u);
  return {
    finished,
    stop: () => {
      stopped = true;
      synth.cancel();
      (fallback as Playback | null)?.stop();
    },
  };
}

export const mockSpeech: SpeechService = {
  async startRecording() {
    return mockRecording();
  },

  async speechToText({ scene, stepIndex }) {
    // Pretend to upload and transcribe.
    await wait(650);
    const step = scene.dialogue[Math.min(stepIndex, scene.dialogue.length - 1)];
    return { text: step.sampleAnswer, confidence: 0.92 };
  },

  textToSpeech: browserTextToSpeech,
};

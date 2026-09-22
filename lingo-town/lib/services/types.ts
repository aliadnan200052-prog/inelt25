import type { ChatMessage, Correction, Highlight, Scene } from "@/data/types";

/* ------------------------------------------------------------------ */
/* Contracts for the pluggable services. Swap the mock implementation  */
/* in lib/services/index.ts for real providers without touching UI.    */
/* ------------------------------------------------------------------ */

/** A live microphone capture. `level()` drives the waveform (0..1). */
export interface Recording {
  level(): number;
  /** Stops capture. Resolves with the audio, or null for the mock. */
  stop(): Promise<Blob | null>;
  cancel(): void;
}

export type SpeechToTextInput = {
  audio: Blob | null;
  /** Context that improves recognition (and powers the mock). */
  scene: Scene;
  stepIndex: number;
  lang?: string;
};

export type SpeechToTextResult = { text: string; confidence: number };

export type CharacterReplyInput = {
  scene: Scene;
  history: ChatMessage[];
  learnerText: string;
  stepIndex: number;
  /** Harder levels speak faster and use fewer hints. */
  difficulty?: "normal" | "harder";
};

export type CharacterLine = { text: string; highlights?: Highlight[] };

export type CharacterReply = {
  /** One or more bubbles, shown with a typing pause between them. */
  lines: CharacterLine[];
  /** Present when the learner's words were recast. */
  correction?: Correction;
  nextStepIndex: number;
  done: boolean;
};

export type TextToSpeechOptions = {
  lang?: string;
  /** 1 = natural speed; the "Slower" control uses ~0.75. */
  rate?: number;
  pitch?: number;
  preferredVoices?: string[];
  onBoundary?: (charIndex: number) => void;
};

export interface Playback {
  /** Resolves when speech ends or is stopped. */
  finished: Promise<void>;
  stop(): void;
}

export interface SpeechService {
  startRecording(): Promise<Recording>;
  speechToText(input: SpeechToTextInput): Promise<SpeechToTextResult>;
  textToSpeech(text: string, opts?: TextToSpeechOptions): Playback;
}

export interface ConversationService {
  getCharacterReply(input: CharacterReplyInput): Promise<CharacterReply>;
}

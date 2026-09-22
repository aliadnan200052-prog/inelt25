/**
 * Content model for Lingo Town.
 *
 * Everything the UI renders comes from these shapes, so real content
 * (a CMS, Supabase tables, or generated scenes) can replace the mock
 * files in /data without touching components.
 */

export type ID = string;

/** Arabic helper copy. Always rendered with lang="ar" dir="rtl". */
export type ArabicText = string;

export type PortraitStyle = {
  skin: string;
  hair: string;
  hairStyle: "bun" | "short" | "curly" | "long" | "bald" | "hijab";
  outfit: string;
  accent?: string;
  glasses?: boolean;
  beard?: boolean;
};

export type Character = {
  id: ID;
  name: string;
  role: string;
  roleAr: ArabicText;
  placeId: ID;
  /** One-line personality note shown on the character card. */
  blurb: string;
  portrait: PortraitStyle;
  /** Hints for a future TTS provider (voice id, pitch, rate). */
  voice: { lang: string; pitch?: number; rate?: number; preferredNames?: string[] };
};

export type PlaceStatus = "open" | "locked" | "done";

export type Place = {
  id: ID;
  name: string;
  nameAr: ArabicText;
  status: PlaceStatus;
  /** Scene opened when the place is tapped. */
  sceneId?: ID;
  /** Shown on locked places, e.g. "Finish the café first". */
  unlockHint?: string;
  /** Pin position on the town map, as a % of the map box. */
  map: { x: number; y: number };
};

export type Phrase = {
  id: ID;
  text: string;
  meaningAr: ArabicText;
  /** Short usage note in English, e.g. "Polite way to order". */
  note?: string;
  /** Pre-recorded audio URL; falls back to textToSpeech() when absent. */
  audioUrl?: string;
  placeId: ID;
};

export type TranscriptLine = {
  speaker: "character" | "other";
  /** Name shown in captions when speaker is "other". */
  name?: string;
  text: string;
};

export type SceneMedia = {
  /** Real video/audio URL later; the mock plays the transcript via TTS. */
  src?: string;
  poster?: string;
  durationSec: number;
  transcript: TranscriptLine[];
};

/**
 * One step in a scripted mock conversation. A real LLM replaces this via
 * getCharacterReply(); the script only powers the offline demo.
 */
export type DialogueStep = {
  id: ID;
  /** What the character says to open this step. */
  prompt: string;
  /** Hint offered to the learner for this step. */
  hint: { text: string; meaningAr: ArabicText };
  /** Sample learner answer the mock speech-to-text returns. */
  sampleAnswer: string;
  /** Character's reply when the learner answers well. */
  reply: string;
};

/** Detects a common learner error and recasts it in the character's reply. */
export type RecastRule = {
  id: ID;
  /** Case-insensitive pattern matched against the learner's words. */
  pattern: string;
  /** Replaces the matched words to build the learner's better version. */
  better: string;
  /** The corrected form as the character naturally echoes it (highlighted). */
  recast: string;
  /** The character's reply. `{recast}` marks where the highlight goes. */
  replyTemplate: string;
  explanationAr: ArabicText;
};

export type Scene = {
  id: ID;
  placeId: ID;
  characterId: ID;
  title: string;
  titleAr: ArabicText;
  /** What the learner is trying to do, framed as a real-life goal. */
  goal: string;
  goalAr: ArabicText;
  /** Headline on the Review screen when the goal is met. */
  successTitle: string;
  level: "A1" | "A2" | "B1";
  minutes: number;
  media: SceneMedia;
  keyPhrases: Phrase[];
  rescuePhrase: Phrase;
  dialogue: DialogueStep[];
  recasts: RecastRule[];
  /** Closing line once every step is done. */
  closing: string;
};

/* ---------------- Conversation runtime types ---------------- */

export type Highlight = { start: number; end: number };

export type ChatMessage = {
  id: ID;
  from: "character" | "learner";
  text: string;
  /** Character only: ranges to softly highlight (recast phrases). */
  highlights?: Highlight[];
  /** Learner only: the recast that was applied to this message. */
  correction?: Correction;
  createdAt: number;
};

export type Correction = {
  said: string;
  better: string;
  explanationAr: ArabicText;
  ruleId?: ID;
};

export type SessionSummary = {
  sceneId: ID;
  goalMet: boolean;
  turns: number;
  wentWell: string[];
  focus?: Correction;
  phrasesAdded: Phrase[];
};

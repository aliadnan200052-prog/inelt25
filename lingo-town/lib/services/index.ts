/**
 * Service entry point. The UI imports only these three functions (plus
 * startRecording), so swapping mocks for real providers is a one-file change:
 *
 *   speechToText      → Whisper / Deepgram / Azure STT via a route handler
 *   getCharacterReply → an LLM route handler (app/api/reply/route.ts)
 *   textToSpeech      → pre-generated audio or a streaming TTS endpoint
 */
import { mockConversation } from "./mock-conversation";
import { mockSpeech } from "./mock-speech";
import type { ConversationService, SpeechService } from "./types";

const speech: SpeechService = mockSpeech;
const conversation: ConversationService = mockConversation;

export const startRecording = () => speech.startRecording();
export const speechToText: SpeechService["speechToText"] = (input) => speech.speechToText(input);
export const textToSpeech: SpeechService["textToSpeech"] = (text, opts) => speech.textToSpeech(text, opts);
export const getCharacterReply: ConversationService["getCharacterReply"] = (input) =>
  conversation.getCharacterReply(input);

export type * from "./types";

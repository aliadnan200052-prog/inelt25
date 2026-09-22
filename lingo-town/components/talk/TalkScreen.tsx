"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Keyboard, LifeBuoy, Lightbulb, Mic, Repeat2, SendHorizontal, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/nav/TopBar";
import { ProgressSteps } from "@/components/scene/ProgressSteps";
import { SpeakButton } from "@/components/scene/SpeakButton";
import { ButtonLink } from "@/components/ui/Button";
import { Ar, Chip, IconButton, Pill } from "@/components/ui/primitives";
import { getCharacter } from "@/data/characters";
import { getScene } from "@/data/scenes";
import type { ChatMessage } from "@/data/types";
import { haptic } from "@/lib/haptics";
import { useSpeaker } from "@/lib/hooks/useSpeaker";
import { softSpring } from "@/lib/motion";
import { completeScene } from "@/lib/progress";
import {
  getCharacterReply,
  speechToText,
  startRecording,
  summarizeSession,
  type CharacterLine,
  type Recording,
} from "@/lib/services";
import { ChatBubble, TypingIndicator } from "./ChatBubble";
import { MicButton } from "./MicButton";

type Status = "intro" | "character" | "idle" | "recording" | "transcribing" | "done";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let seq = 0;
const newId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

export function TalkScreen({ sceneId, harder = false }: { sceneId: string; harder?: boolean }) {
  const scene = getScene(sceneId)!;
  const character = getCharacter(scene.characterId);
  const reduceMotion = useReducedMotion();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState<Status>("intro");
  const [step, setStep] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [draft, setDraft] = useState("");
  const rec = useRef<Recording | null>(null);
  const started = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { speak, stop, speakingId } = useSpeaker();

  const voice = {
    lang: character.voice.lang,
    pitch: character.voice.pitch,
    rate: (character.voice.rate ?? 1) * (harder ? 1.1 : 1),
    preferredVoices: character.voice.preferredNames,
  };

  const push = useCallback((m: ChatMessage) => {
    messagesRef.current = [...messagesRef.current, m];
    setMessages(messagesRef.current);
  }, []);

  const patch = useCallback((id: string, p: Partial<ChatMessage>) => {
    messagesRef.current = messagesRef.current.map((m) => (m.id === id ? { ...m, ...p } : m));
    setMessages(messagesRef.current);
  }, []);

  /** Character "types" each line, then says it aloud. */
  const characterSays = useCallback(
    async (lines: CharacterLine[]) => {
      for (const line of lines) {
        setTyping(true);
        await wait(Math.min(1500, 550 + line.text.length * 16));
        setTyping(false);
        const m: ChatMessage = { id: newId(), from: "character", createdAt: Date.now(), ...line };
        push(m);
        haptic("soft");
        await speak(m.id, m.text, voice);
        await wait(180);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [push, speak, harder],
  );

  // Opening line.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      await wait(400);
      await characterSays([{ text: scene.dialogue[0].prompt }]);
      setStatus("idle");
    })();
  }, [characterSays, scene]);

  // Keep the newest bubble in view.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
  }, [messages.length, typing, status, showHint, reduceMotion]);

  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text || status === "character" || status === "done") return;
    stop();
    setShowHint(false);
    setDraft("");
    const mine: ChatMessage = { id: newId(), from: "learner", text, createdAt: Date.now() };
    push(mine);
    setStatus("character");

    const reply = await getCharacterReply({
      scene,
      history: messagesRef.current,
      learnerText: text,
      stepIndex: step,
      difficulty: harder ? "harder" : "normal",
    });
    if (reply.correction) patch(mine.id, { correction: reply.correction });
    await characterSays(reply.lines);
    setStep(reply.nextStepIndex);

    if (reply.done) {
      const summary = await summarizeSession(scene, messagesRef.current);
      completeScene(summary);
      haptic("success");
      setStatus("done");
    } else {
      setStatus("idle");
    }
  };

  const startRec = async () => {
    stop();
    setStatus("recording");
    rec.current = await startRecording();
  };

  const stopRec = async () => {
    const r = rec.current;
    rec.current = null;
    setStatus("transcribing");
    const audio = r ? await r.stop() : null;
    const { text } = await speechToText({ audio, scene, stepIndex: step, lang: "en" });
    setStatus("idle");
    await submit(text);
  };

  const micLevel = useCallback(() => rec.current?.level() ?? 0.3, []);
  const lastCharacter = [...messages].reverse().find((m) => m.from === "character");
  const hint = scene.dialogue[Math.min(step, scene.dialogue.length - 1)].hint;
  const canAct = status === "idle";

  return (
    <>
      <TopBar
        title={`Talking with ${character.name}`}
        fallbackHref={`/scene/${scene.id}`}
        right={harder ? <Pill tone="terra">Harder</Pill> : undefined}
      >
        <ProgressSteps current={status === "done" ? 3 : 2} />
      </TopBar>

      <div className="pb-[calc(280px+env(safe-area-inset-bottom))] pt-3">
        <h1 className="sr-only">
          {scene.title}: talking with {character.name}
        </h1>
        <div className="mx-auto mb-5 max-w-[22rem] rounded-2xl border border-dashed border-line-strong px-4 py-3 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Your goal</p>
          <p className="mt-0.5 text-sm text-ink">{scene.goal}</p>
          <Ar className="text-xs text-muted">{scene.goalAr}</Ar>
        </div>

        <ul className="flex flex-col gap-2.5" aria-live="polite" aria-relevant="additions" aria-label="Conversation">
          {messages.map((m, i) => (
            <ChatBubble
              key={m.id}
              message={m}
              character={character}
              showAvatar={m.from === "character" && messages[i - 1]?.from !== "character"}
              speaking={speakingId === m.id}
              onHear={() => (speakingId === m.id ? stop() : speak(m.id, m.text, voice))}
            />
          ))}
          <AnimatePresence>{typing && <TypingIndicator key="typing" character={character} />}</AnimatePresence>
        </ul>
        <div ref={bottom} className="h-px" />
      </div>

      {/* ---------------------------- control dock ---------------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-cream/95 backdrop-blur-xl pb-safe">
        <div className="mx-auto max-w-[640px] px-4 pb-3 pt-3">
          <AnimatePresence mode="wait" initial={false}>
            {status === "done" ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={softSpring}
                className="flex flex-col gap-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-teal-soft text-teal">
                    <Sparkles className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">Goal complete</p>
                    <p className="text-sm text-muted">Nicely done. Let&rsquo;s look at how it went.</p>
                  </div>
                </div>
                <ButtonLink href={`/scene/${scene.id}/review`} size="lg" block>
                  See how you did
                  <ArrowRight className="size-5" aria-hidden />
                </ButtonLink>
              </motion.div>
            ) : (
              <motion.div key="controls" exit={{ opacity: 0, y: 10 }}>
                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={softSpring}
                      className="overflow-hidden"
                    >
                      <div className="mb-3 flex items-center gap-3 rounded-card-sm border border-sun/40 bg-sun-soft p-3.5 pl-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b4d0c] dark:text-sun">
                            Try saying
                          </p>
                          <p className="font-display text-lg font-medium leading-snug text-ink">{hint.text}</p>
                          <Ar className="text-sm text-muted">{hint.meaningAr}</Ar>
                        </div>
                        <SpeakButton
                          speaking={speakingId === "hint"}
                          onPress={() => (speakingId === "hint" ? stop() : speak("hint", hint.text, { rate: 0.85 }))}
                          label={hint.text}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="no-scrollbar -mx-4 flex justify-center gap-2 overflow-x-auto px-4">
                  <Chip
                    icon={<Lightbulb className="size-4" aria-hidden />}
                    active={showHint}
                    aria-expanded={showHint}
                    disabled={harder}
                    onClick={() => setShowHint((s) => !s)}
                    className="disabled:opacity-50"
                  >
                    {harder ? "Hints off" : showHint ? "Hide hint" : "Show a hint"}
                  </Chip>
                  <Chip
                    icon={<Repeat2 className="size-4" aria-hidden />}
                    disabled={!lastCharacter}
                    onClick={() => lastCharacter && speak(lastCharacter.id, lastCharacter.text, { ...voice, rate: 0.8 })}
                  >
                    Hear it again
                  </Chip>
                </div>

                {keyboard ? (
                  <form
                    className="mt-3 flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submit(draft);
                    }}
                  >
                    <IconButton label="Use the microphone" onClick={() => setKeyboard(false)}>
                      <Mic className="size-5" aria-hidden />
                    </IconButton>
                    <label htmlFor="reply" className="sr-only">
                      Your reply
                    </label>
                    <input
                      id="reply"
                      ref={inputRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Reply to ${character.name}…`}
                      autoComplete="off"
                      autoCapitalize="sentences"
                      enterKeyHint="send"
                      lang="en"
                      className="h-12 min-w-0 flex-1 rounded-btn border border-line bg-surface px-4 text-base text-ink shadow-soft placeholder:text-muted focus:border-teal focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1"
                    />
                    <IconButton
                      label="Send"
                      type="submit"
                      tone="teal"
                      disabled={!draft.trim() || !canAct}
                      className="size-12 bg-teal text-on-teal disabled:opacity-40"
                    >
                      <SendHorizontal className="size-5" aria-hidden />
                    </IconButton>
                  </form>
                ) : (
                  <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center">
                    <div className="flex justify-start">
                      <IconButton
                        label="Type instead"
                        onClick={() => {
                          setKeyboard(true);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                      >
                        <Keyboard className="size-5" aria-hidden />
                      </IconButton>
                    </div>
                    <MicButton
                      state={
                        status === "recording"
                          ? "recording"
                          : status === "transcribing"
                            ? "busy"
                            : canAct
                              ? "idle"
                              : "disabled"
                      }
                      onStart={startRec}
                      onStop={stopRec}
                      level={micLevel}
                    />
                    <div className="flex justify-end">
                      <IconButton
                        label={`Say the rescue phrase: ${scene.rescuePhrase.text}`}
                        disabled={!canAct}
                        onClick={() => submit(scene.rescuePhrase.text)}
                        className="text-terra-deep disabled:opacity-40"
                      >
                        <LifeBuoy className="size-5" aria-hidden />
                      </IconButton>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

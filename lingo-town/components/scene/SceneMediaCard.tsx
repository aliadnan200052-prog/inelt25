"use client";

import { AnimatePresence, motion } from "motion/react";
import { Captions, CaptionsOff, Pause, Play, RotateCcw, Turtle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SceneArt } from "@/components/illustrations/SceneArt";
import { Chip, IconButton } from "@/components/ui/primitives";
import type { Character, Scene } from "@/data/types";
import { haptic } from "@/lib/haptics";
import { spring } from "@/lib/motion";
import { textToSpeech, type Playback } from "@/lib/services";

type Props = { scene: Scene; character: Character; onFinished?: () => void };

const SLOW = 0.75;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * The scene "video". Until real media exists, it plays the transcript
 * line by line through textToSpeech() with synced captions and progress.
 */
export function SceneMediaCard({ scene, character, onFinished }: Props) {
  const lines = scene.media.transcript;
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(-1);
  const [slower, setSlower] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [progress, setProgress] = useState(0);
  const [ended, setEnded] = useState(false);

  const run = useRef(0);
  const pb = useRef<Playback | null>(null);
  const slowerRef = useRef(slower);
  slowerRef.current = slower;

  // Weight each line by length so the bar moves at a believable pace.
  const weights = lines.map((l) => l.text.length + 12);
  const total = weights.reduce((a, b) => a + b, 0);
  const startOf = (i: number) => weights.slice(0, i).reduce((a, b) => a + b, 0) / total;

  const stop = useCallback(() => {
    run.current++;
    pb.current?.stop();
    setPlaying(false);
  }, []);

  const play = useCallback(
    async (from: number) => {
      const mine = ++run.current;
      setPlaying(true);
      setEnded(false);
      for (let i = from; i < lines.length; i++) {
        if (run.current !== mine) return;
        setLine(i);
        const l = lines[i];
        const rate = slowerRef.current ? SLOW : 1;
        const est = ((l.text.length * 62) / rate) | 0;
        const t0 = performance.now();
        const p0 = startOf(i);
        const span = weights[i] / total;
        let raf = 0;
        const tick = () => {
          const f = Math.min(1, (performance.now() - t0) / est);
          setProgress(p0 + span * f);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        const isChar = l.speaker === "character";
        pb.current = textToSpeech(l.text, {
          rate: rate * (isChar ? (character.voice.rate ?? 1) : 1),
          lang: isChar ? character.voice.lang : "en-US",
          pitch: isChar ? character.voice.pitch : 0.95,
          preferredVoices: isChar ? character.voice.preferredNames : undefined,
        });
        await pb.current.finished;
        cancelAnimationFrame(raf);
        if (run.current !== mine) return;
        setProgress(startOf(i + 1));
        await new Promise((r) => setTimeout(r, 350));
      }
      if (run.current !== mine) return;
      setPlaying(false);
      setEnded(true);
      haptic("success");
      onFinished?.();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, character],
  );

  useEffect(() => stop, [stop]);

  const toggle = () => {
    if (playing) stop();
    else play(ended || line < 0 ? 0 : line);
  };

  const current = line >= 0 ? lines[line] : null;
  const elapsed = progress * scene.media.durationSec * (slower ? 1 / SLOW : 1);
  const duration = scene.media.durationSec * (slower ? 1 / SLOW : 1);

  return (
    <section aria-label="Scene video" className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="relative aspect-[16/10] overflow-hidden bg-cream-deep">
        <SceneArt placeId={scene.placeId} character={character} className="size-full" />

        <AnimatePresence>
          {!playing && (
            <motion.button
              key="play"
              type="button"
              onClick={() => {
                haptic("press");
                toggle();
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileTap={{ scale: 0.94 }}
              transition={spring}
              className="absolute inset-0 grid place-items-center"
              aria-label={ended ? "Watch again" : line >= 0 ? "Resume" : "Play the scene"}
            >
              <span className="grid size-[72px] place-items-center rounded-full bg-surface text-teal shadow-lift ring-8 ring-surface/40">
                {ended ? (
                  <RotateCcw className="size-7" strokeWidth={2.2} aria-hidden />
                ) : (
                  <Play className="ml-1 size-8 fill-current" aria-hidden />
                )}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {captions && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3" aria-live="polite">
            <AnimatePresence mode="wait">
              {current && playing && (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="mx-auto w-fit max-w-full rounded-2xl bg-ink/88 px-3.5 py-2 text-center text-sm font-medium leading-snug text-[#FFFDF8] shadow-card backdrop-blur"
                >
                  <span className="mr-1.5 text-xs font-bold uppercase tracking-wider text-sun">
                    {current.speaker === "character" ? character.name : current.name}
                  </span>
                  {current.text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 p-3 pr-4">
        <IconButton label={playing ? "Pause" : "Play"} tone="teal" onClick={toggle}>
          {playing ? <Pause className="size-5 fill-current" aria-hidden /> : <Play className="ml-0.5 size-5 fill-current" aria-hidden />}
        </IconButton>
        <div className="min-w-0 flex-1">
          <div
            className="relative h-1.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label="Playback"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-teal" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="tabular mt-1.5 text-xs text-muted">
            {fmt(elapsed)} / {fmt(duration)}
          </p>
        </div>
        <IconButton
          label={captions ? "Hide captions" : "Show captions"}
          tone="clear"
          aria-pressed={captions}
          onClick={() => setCaptions((c) => !c)}
        >
          {captions ? <Captions className="size-5" aria-hidden /> : <CaptionsOff className="size-5 text-muted" aria-hidden />}
        </IconButton>
        <Chip
          active={slower}
          aria-pressed={slower}
          onClick={() => setSlower((s) => !s)}
          icon={<Turtle className="size-4" aria-hidden />}
          className="px-3.5"
        >
          Slower
        </Chip>
      </div>
    </section>
  );
}

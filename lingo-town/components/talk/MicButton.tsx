"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

type Props = {
  state: "idle" | "recording" | "busy" | "disabled";
  onStart: () => void;
  onStop: () => void;
  /** Current mic level (0..1), polled every frame while recording. */
  level?: () => number;
};

const TAP_MS = 280;

/**
 * Hold to speak; release to send. A quick tap switches to tap-to-start /
 * tap-to-stop, which also serves keyboard and switch-access users.
 */
export function MicButton({ state, onStart, onStop, level }: Props) {
  const recording = state === "recording";
  const phase = useRef<"idle" | "holding" | "latched" | "stopping">("idle");
  const downAt = useRef(0);
  const [latched, setLatched] = useState(false);

  // If the parent leaves "recording" on its own, reset the gesture.
  useEffect(() => {
    if (!recording) {
      if (phase.current !== "stopping") phase.current = "idle";
      setLatched(false);
    }
  }, [recording]);

  const begin = () => {
    if (phase.current === "latched") {
      phase.current = "stopping";
      haptic("press");
      onStop();
      return;
    }
    if (state !== "idle") return;
    phase.current = "holding";
    downAt.current = performance.now();
    haptic("press");
    onStart();
  };

  const end = () => {
    if (phase.current === "stopping") {
      phase.current = "idle";
      return;
    }
    if (phase.current !== "holding") return;
    if (performance.now() - downAt.current < TAP_MS) {
      // Quick tap: keep listening until tapped again.
      phase.current = "latched";
      setLatched(true);
      return;
    }
    phase.current = "idle";
    haptic("tap");
    onStop();
  };

  const label =
    state === "busy" ? "Listening back…" : recording ? (latched ? "Tap to send" : "Release to send") : "Hold to speak";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative grid size-[104px] place-items-center">
        <PulseRings active={recording} />
        <motion.button
          type="button"
          aria-label={recording ? "Stop and send" : "Hold to speak"}
          aria-pressed={recording}
          disabled={state === "disabled"}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            begin();
          }}
          onPointerUp={end}
          onPointerCancel={end}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              begin();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              end();
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          animate={{ scale: recording ? 1.06 : 1 }}
          whileTap={{ scale: recording ? 1.02 : 0.95 }}
          transition={spring}
          className={cn(
            "relative z-10 grid size-[84px] touch-none select-none place-items-center rounded-full text-on-teal shadow-teal transition-colors [-webkit-touch-callout:none]",
            recording ? "bg-terra dark:text-[#1a0f0a]" : "bg-teal hover:bg-teal-pressed",
            state === "disabled" && "opacity-50",
          )}
        >
          {state === "busy" ? (
            <Loader2 className="size-8 animate-spin" aria-hidden />
          ) : recording ? (
            <Waveform level={level} />
          ) : (
            <Mic className="size-8" strokeWidth={2} aria-hidden />
          )}
        </motion.button>
      </div>
      <p className="h-5 text-sm font-bold text-muted" aria-live="polite">
        {label}
      </p>
    </div>
  );
}

function PulseRings({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {active &&
        [0, 1].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute inset-[10px] rounded-full bg-terra/25"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={reduce ? { scale: 1.15, opacity: 0.4 } : { scale: [1, 1.45], opacity: [0.55, 0] }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={reduce ? undefined : { duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
          />
        ))}
    </AnimatePresence>
  );
}

const BARS = 5;

/** Live bars driven by the mic level, with per-bar variation. */
function Waveform({ level }: { level?: () => number }) {
  const [heights, setHeights] = useState<number[]>(() => Array(BARS).fill(0.2));
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 60) {
        last = t;
        const l = level?.() ?? 0.5;
        setHeights((prev) =>
          prev.map((_, i) => {
            const shape = 1 - Math.abs(i - (BARS - 1) / 2) / BARS; // taller in the middle
            return Math.max(0.15, Math.min(1, l * shape * (0.7 + Math.random() * 0.6)));
          }),
        );
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [level]);

  return (
    <span aria-hidden className="flex h-9 items-center gap-[5px]">
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-[5px] rounded-full bg-current"
          animate={{ height: `${Math.round(h * 100)}%` }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
        />
      ))}
    </span>
  );
}

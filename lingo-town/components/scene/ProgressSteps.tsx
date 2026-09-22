"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

export const SCENE_STEPS = ["Listen", "Learn", "Talk", "Review"] as const;

/** Four-step scene progress. `current` is the active step index. */
export function ProgressSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Scene progress" className="pb-3">
      <ol className="grid grid-cols-4 gap-1.5">
        {SCENE_STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className="flex flex-col gap-1.5">
              <span className="relative h-1.5 overflow-hidden rounded-full bg-line">
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-teal"
                  initial={false}
                  animate={{ width: done ? "100%" : active ? "50%" : "0%" }}
                  transition={spring}
                />
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-bold",
                  active ? "text-ink" : done ? "text-teal-pressed dark:text-teal" : "text-muted",
                )}
              >
                {done && <Check className="size-3" strokeWidth={3} aria-hidden />}
                {label}
                <span className="sr-only">{done ? " (done)" : active ? " (current)" : ""}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

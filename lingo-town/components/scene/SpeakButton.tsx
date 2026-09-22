"use client";

import { motion } from "motion/react";
import { Volume2 } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

/** Tap-to-hear button with a live "speaking" state (animated bars). */
export function SpeakButton({
  speaking,
  onPress,
  label,
  tone = "teal",
  className,
}: {
  speaking: boolean;
  onPress: () => void;
  label: string;
  tone?: "teal" | "terra";
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      aria-label={speaking ? `Stop: ${label}` : `Hear: ${label}`}
      aria-pressed={speaking}
      whileTap={{ scale: 0.9 }}
      transition={spring}
      onClick={() => {
        haptic("soft");
        onPress();
      }}
      className={cn(
        "inline-grid size-11 shrink-0 place-items-center rounded-full transition-colors",
        tone === "teal" &&
          (speaking ? "bg-teal text-on-teal" : "bg-teal-soft text-teal-pressed hover:bg-teal/15 dark:text-teal"),
        tone === "terra" &&
          (speaking ? "bg-terra text-white" : "bg-surface text-terra-deep shadow-soft hover:bg-surface-2"),
        className,
      )}
    >
      {speaking ? <Bars /> : <Volume2 className="size-5" aria-hidden />}
    </motion.button>
  );
}

function Bars() {
  return (
    <span aria-hidden className="flex h-4 items-end gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-current"
          animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

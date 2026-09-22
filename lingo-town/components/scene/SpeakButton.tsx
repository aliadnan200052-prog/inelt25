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
  size = "md",
  className,
}: {
  speaking: boolean;
  onPress: () => void;
  label: string;
  tone?: "teal" | "terra";
  /** "sm" keeps a 44px touch target around a quieter 32px disc. */
  size?: "md" | "sm";
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
      className={cn("group inline-grid size-11 shrink-0 place-items-center rounded-full", className)}
    >
      <span
        className={cn(
          "grid place-items-center rounded-full transition-colors",
          size === "sm" ? "size-8 [&_svg]:size-4" : "size-11",
          tone === "teal" &&
            (speaking
              ? "bg-teal text-on-teal"
              : size === "sm"
                ? "text-muted group-hover:bg-teal-soft group-hover:text-teal-pressed"
                : "bg-teal-soft text-teal-pressed group-hover:bg-teal/15 dark:text-teal"),
          tone === "terra" &&
            (speaking ? "bg-terra text-white" : "bg-surface text-terra-deep shadow-soft group-hover:bg-surface-2"),
        )}
      >
        {speaking ? <Bars /> : <Volume2 className="size-5" aria-hidden />}
      </span>
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

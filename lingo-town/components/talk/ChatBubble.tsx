"use client";

import { motion } from "motion/react";
import { Portrait } from "@/components/illustrations/Portrait";
import { SpeakButton } from "@/components/scene/SpeakButton";
import type { Character, ChatMessage, Highlight } from "@/data/types";
import { cn } from "@/lib/cn";
import { softSpring } from "@/lib/motion";

/** Splits text into plain and highlighted runs. */
function segments(text: string, highlights: Highlight[] = []) {
  const out: { text: string; hl: boolean }[] = [];
  let i = 0;
  for (const h of [...highlights].sort((a, b) => a.start - b.start)) {
    if (h.start > i) out.push({ text: text.slice(i, h.start), hl: false });
    out.push({ text: text.slice(h.start, h.end), hl: true });
    i = h.end;
  }
  if (i < text.length) out.push({ text: text.slice(i), hl: false });
  return out;
}

type Props = {
  message: ChatMessage;
  character: Character;
  /** Show the avatar (first bubble in a run from the character). */
  showAvatar?: boolean;
  speaking?: boolean;
  onHear?: () => void;
};

export function ChatBubble({ message, character, showAvatar, speaking, onHear }: Props) {
  const mine = message.from === "learner";

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={softSpring}
      style={{ originX: mine ? 1 : 0, originY: 1 }}
      className={cn("flex items-end gap-2", mine ? "justify-end pl-12" : "pr-2")}
    >
      {!mine && (
        <span className="w-9 shrink-0">
          {showAvatar && <Portrait style={character.portrait} size={36} />}
        </span>
      )}

      <div className={cn("flex min-w-0 flex-col", mine ? "items-end" : "items-start")}>
        {!mine && showAvatar && <span className="mb-1 ml-1 text-xs font-bold text-muted">{character.name}</span>}
        <div className="flex items-end gap-0.5">
          <p
            className={cn(
              "rounded-[20px] px-4 py-2.5 text-base leading-[1.45]",
              mine
                ? "rounded-br-md bg-teal text-on-teal shadow-teal"
                : "rounded-bl-md border border-line bg-surface text-ink shadow-soft",
            )}
          >
            {segments(message.text, message.highlights).map((s, i) =>
              s.hl ? (
                <mark
                  key={i}
                  className="rounded-md bg-sun-soft box-decoration-clone px-1 py-px font-medium text-ink decoration-sun decoration-2 underline-offset-4 [text-decoration-line:underline]"
                >
                  <span className="sr-only">Better way to say it: </span>
                  {s.text}
                </mark>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </p>
          {!mine && onHear && (
            <SpeakButton speaking={!!speaking} onPress={onHear} label={message.text} size="sm" className="-ml-1" />
          )}
        </div>
        {mine && message.correction && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mr-1 mt-1 text-xs text-muted"
          >
            {character.name} said it another way. Listen for the highlight.
          </motion.p>
        )}
      </div>
    </motion.li>
  );
}

export function TypingIndicator({ character }: { character: Character }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={softSpring}
      className="flex items-end gap-2"
      aria-label={`${character.name} is typing`}
    >
      <span className="w-9 shrink-0">
        <Portrait style={character.portrait} size={36} />
      </span>
      <span className="flex h-11 items-center gap-1.5 rounded-[20px] rounded-bl-md border border-line bg-surface px-4 shadow-soft">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-muted/60"
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
          />
        ))}
      </span>
    </motion.li>
  );
}

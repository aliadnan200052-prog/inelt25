"use client";

import { LifeBuoy } from "lucide-react";
import { Ar, Card } from "@/components/ui/primitives";
import type { Phrase } from "@/data/types";
import { SpeakButton } from "./SpeakButton";

/** The one phrase to reach for when the learner gets lost. */
export function RescueCard({ phrase, speaking, onHear }: { phrase: Phrase; speaking: boolean; onHear: () => void }) {
  return (
    <Card tone="terra" className="relative overflow-hidden p-5">
      <svg aria-hidden viewBox="0 0 120 120" className="absolute -right-6 -top-6 size-28 text-terra opacity-[0.09]">
        <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="20" />
      </svg>
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-terra-deep">
        <LifeBuoy className="size-4" strokeWidth={2.2} aria-hidden />
        Rescue phrase
      </p>
      <div className="mt-2 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-semibold leading-snug tracking-[-0.015em] text-ink">{phrase.text}</p>
          <Ar className="mt-1 text-sm text-terra-deep">{phrase.meaningAr}</Ar>
          <p className="mt-2 text-sm text-ink/80">{phrase.note ?? "Say this any time you get lost. Nobody minds."}</p>
        </div>
        <SpeakButton speaking={speaking} onPress={onHear} label={phrase.text} tone="terra" />
      </div>
    </Card>
  );
}

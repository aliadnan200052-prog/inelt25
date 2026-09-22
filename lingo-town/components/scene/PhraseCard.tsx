"use client";

import { Ar, Card } from "@/components/ui/primitives";
import type { Phrase } from "@/data/types";
import { SpeakButton } from "./SpeakButton";

type Props = {
  phrase: Phrase;
  speaking: boolean;
  onHear: () => void;
  /** Optional slot on the right of the note row (e.g. a due badge). */
  meta?: React.ReactNode;
};

export function PhraseCard({ phrase, speaking, onHear, meta }: Props) {
  return (
    <Card className="flex items-start gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-medium leading-snug tracking-[-0.01em] text-ink">{phrase.text}</p>
        <Ar className="mt-1 text-sm text-muted">{phrase.meaningAr}</Ar>
        {(phrase.note || meta) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {phrase.note && <p className="text-xs font-medium text-muted">{phrase.note}</p>}
            {meta}
          </div>
        )}
      </div>
      <SpeakButton speaking={speaking} onPress={onHear} label={phrase.text} />
    </Card>
  );
}

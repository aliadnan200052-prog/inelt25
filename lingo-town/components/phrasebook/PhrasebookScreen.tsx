"use client";

import { AnimatePresence, motion } from "motion/react";
import { BookOpen, CalendarClock, Check, RotateCcw } from "lucide-react";
import { PhraseCard } from "@/components/scene/PhraseCard";
import { SpeakButton } from "@/components/scene/SpeakButton";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Ar, Card, Pill, SectionHeader } from "@/components/ui/primitives";
import { places } from "@/data/places";
import { phrasesById } from "@/data/scenes";
import type { Phrase } from "@/data/types";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useSpeaker } from "@/lib/hooks/useSpeaker";
import { rise, softSpring, stagger } from "@/lib/motion";
import { isDue, reviewPhrase, useProgress, type SavedPhrase } from "@/lib/progress";

const DAY = 86_400_000;

function dueLabel(s: SavedPhrase, now: number) {
  const days = Math.ceil((s.dueAt - now) / DAY);
  if (days <= 0) return "Due now";
  if (days === 1) return "Review tomorrow";
  return `Review in ${days} days`;
}

export function PhrasebookScreen() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const { speak, stop, speakingId } = useSpeaker();
  const now = hydrated ? Date.now() : 0;

  const saved = Object.values(progress.saved)
    .map((s) => ({ s, p: phrasesById.get(s.phraseId) }))
    .filter((x): x is { s: SavedPhrase; p: Phrase } => !!x.p)
    .sort((a, b) => b.s.addedAt - a.s.addedAt);

  const due = hydrated ? saved.filter((x) => isDue(x.s, now)) : [];
  const groups = places
    .map((place) => ({ place, items: saved.filter((x) => x.p.placeId === place.id) }))
    .filter((g) => g.items.length);

  const hear = (id: string, text: string) => (speakingId === id ? stop() : speak(id, text, { rate: 0.9 }));

  return (
    <motion.div variants={stagger(0.07)} initial="hidden" animate="show" className="flex flex-col gap-7 pt-6">
      <motion.header variants={rise}>
        <h1 className="font-display text-2xl font-semibold text-ink">Phrasebook</h1>
        <p className="mt-1 text-base text-muted">
          <span className="tabular font-bold text-ink">{saved.length}</span> phrases from around town
        </p>
        <Ar className="text-sm text-muted">العبارات التي تعلّمتها، مرتبة حسب المكان.</Ar>
      </motion.header>

      {/* due for review */}
      <motion.section variants={rise} aria-labelledby="due-heading">
        <SectionHeader
          id="due-heading"
          title="Due for review"
          action={hydrated && <Pill tone={due.length ? "terra" : "teal"}>{due.length ? `${due.length} due` : "All caught up"}</Pill>}
        />
        <AnimatePresence mode="popLayout" initial={false}>
          {due.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card tone="teal" variants={undefined} className="flex items-center gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-teal shadow-soft">
                  <Check className="size-5" strokeWidth={2.5} aria-hidden />
                </span>
                <p className="text-base text-ink">
                  {hydrated ? "Nothing due right now. New reviews appear here as phrases come back around." : "Loading…"}
                </p>
              </Card>
            </motion.div>
          ) : (
            <ul className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {due.map(({ s, p }) => (
                  <motion.li
                    key={s.phraseId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, transition: { duration: 0.22 } }}
                    transition={softSpring}
                  >
                    <DueCard phrase={p} speaking={speakingId === p.id} onHear={() => hear(p.id, p.text)} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </AnimatePresence>
      </motion.section>

      {/* grouped by place */}
      {groups.map(({ place, items }) => (
        <motion.section key={place.id} variants={rise} aria-labelledby={`place-${place.id}`}>
          <SectionHeader
            id={`place-${place.id}`}
            title={place.name}
            action={<Ar as="span" className="text-sm text-muted">{place.nameAr}</Ar>}
          />
          <ul className="flex flex-col gap-3">
            {items.map(({ s, p }) => (
              <li key={p.id}>
                <PhraseCard
                  phrase={p}
                  speaking={speakingId === p.id}
                  onHear={() => hear(p.id, p.text)}
                  meta={
                    hydrated && (
                      <Pill tone={isDue(s, now) ? "terra" : "neutral"}>
                        <CalendarClock className="size-3" aria-hidden />
                        {dueLabel(s, now)}
                      </Pill>
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </motion.section>
      ))}

      {saved.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <BookOpen className="size-8 text-teal" aria-hidden />
          <p className="font-display text-lg font-semibold">Your phrasebook is empty</p>
          <p className="text-sm text-muted">Finish a scene and its key phrases land here.</p>
          <ButtonLink href="/" size="sm">
            Go to town
          </ButtonLink>
        </Card>
      )}
    </motion.div>
  );
}

/** Recall card: meaning hidden until revealed, then self-grade. */
function DueCard({ phrase, speaking, onHear }: { phrase: Phrase; speaking: boolean; onHear: () => void }) {
  return (
    // Animated by its own list item, so opt out of the parent stagger.
    <Card variants={undefined} className="flex items-start gap-3 p-4">
      <details className="group min-w-0 flex-1">
        <summary className="cursor-pointer list-none rounded-xl [&::-webkit-details-marker]:hidden">
          <p className="font-display text-lg font-medium leading-snug text-ink">{phrase.text}</p>
          <p className="mt-1 flex min-h-6 items-center text-sm font-medium text-teal-pressed group-open:hidden dark:text-teal">
            Remember the meaning? Tap to check
          </p>
        </summary>
        <div className="mt-2">
          <Ar className="text-base text-ink">{phrase.meaningAr}</Ar>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => reviewPhrase(phrase.id, false)}>
              <RotateCcw className="size-4" aria-hidden />
              Not yet
            </Button>
            <Button variant="soft" size="sm" onClick={() => reviewPhrase(phrase.id, true)}>
              <Check className="size-4" strokeWidth={2.5} aria-hidden />
              Got it
            </Button>
          </div>
        </div>
      </details>
      <SpeakButton speaking={speaking} onPress={onHear} label={phrase.text} />
    </Card>
  );
}

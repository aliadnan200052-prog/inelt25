"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BookmarkCheck, Check, Map, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { SuccessBadge } from "@/components/illustrations/SuccessBadge";
import { TopBar } from "@/components/nav/TopBar";
import { ProgressSteps } from "@/components/scene/ProgressSteps";
import { SpeakButton } from "@/components/scene/SpeakButton";
import { ButtonLink } from "@/components/ui/Button";
import { Ar, Card, Eyebrow } from "@/components/ui/primitives";
import { getCharacter } from "@/data/characters";
import { getScene } from "@/data/scenes";
import type { Scene, SessionSummary } from "@/data/types";
import { haptic } from "@/lib/haptics";
import { useSpeaker } from "@/lib/hooks/useSpeaker";
import { rise, stagger } from "@/lib/motion";
import { useProgress } from "@/lib/progress";

/** Shown when Review is opened directly (no session yet), e.g. a shared link. */
function sampleSummary(scene: Scene): SessionSummary {
  const rule = scene.recasts[0];
  const said = scene.dialogue[0].sampleAnswer;
  return {
    sceneId: scene.id,
    goalMet: true,
    turns: scene.dialogue.length,
    wentWell: [
      `You reached your goal: ${scene.goal.charAt(0).toLowerCase()}${scene.goal.slice(1)}`,
      "You said “please” naturally, which sounds warm and polite",
      "You stayed in English the whole time",
    ],
    focus: rule && {
      said,
      better: said.replace(new RegExp(rule.pattern, "i"), rule.better).replace(/\.$/, ", please."),
      explanationAr: rule.explanationAr,
    },
    phrasesAdded: [...scene.keyPhrases.slice(0, 2), scene.rescuePhrase],
  };
}

export function ReviewScreen({ sceneId }: { sceneId: string }) {
  const scene = getScene(sceneId)!;
  const character = getCharacter(scene.characterId);
  const progress = useProgress();
  const summary = progress.lastSession[sceneId] ?? sampleSummary(scene);
  const { speak, stop, speakingId } = useSpeaker();

  useEffect(() => haptic("success"), []);

  const hear = (id: string, text: string) => (speakingId === id ? stop() : speak(id, text, { rate: 0.9 }));

  return (
    <>
      <TopBar title={scene.title} fallbackHref="/" icon="close">
        <ProgressSteps current={3} />
      </TopBar>

      <motion.div
        variants={stagger(0.09, 0.15)}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5 pb-[calc(40px+env(safe-area-inset-bottom))] pt-4"
      >
        {/* success first */}
        <motion.section variants={rise} className="text-center" aria-labelledby="review-title">
          <SuccessBadge placeId={scene.placeId} />
          <Eyebrow className="mt-3">Scene complete</Eyebrow>
          <h1 id="review-title" className="mt-1 font-display text-2xl font-semibold text-ink">
            {scene.successTitle}
          </h1>
          <p className="mx-auto mt-1.5 max-w-[20rem] text-base text-muted">
            {summary.turns} replies to {character.name}, all in English. That&rsquo;s a real conversation.
          </p>
          <Ar className="mt-1 text-sm text-muted">أحسنت! أنجزت المهمة بنجاح.</Ar>
        </motion.section>

        {/* what went well */}
        <Card aria-labelledby="well-heading">
          <h2 id="well-heading" className="font-display text-lg font-semibold text-ink">
            What went well
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {summary.wentWell.map((w) => (
              <li key={w} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-teal-soft text-teal-pressed dark:text-teal">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-base text-ink">{w}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* one focused correction */}
        {summary.focus && (
          <Card aria-labelledby="polish-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="polish-heading" className="font-display text-lg font-semibold text-ink">
                One thing to polish
              </h2>
              <TrendingUp className="size-5 text-terra" aria-hidden />
            </div>

            <div className="mt-4 rounded-card-sm bg-surface-2 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">You said</p>
              <p className="mt-1 text-base text-ink/75">
                <del className="decoration-terra/70 decoration-2">{summary.focus.said}</del>
              </p>
              <div className="my-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-teal-pressed dark:text-teal">
                <span className="h-px flex-1 bg-line" />
                Try this instead
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="flex items-center gap-3">
                <p className="min-w-0 flex-1 font-display text-xl font-semibold leading-snug tracking-[-0.015em] text-ink">
                  <ins className="rounded-md bg-teal-soft box-decoration-clone px-1.5 py-0.5 no-underline">
                    {summary.focus.better}
                  </ins>
                </p>
                <SpeakButton
                  speaking={speakingId === "better"}
                  onPress={() => hear("better", summary.focus!.better)}
                  label={summary.focus.better}
                />
              </div>
            </div>
            <Ar className="mt-3 text-base text-ink/85">{summary.focus.explanationAr}</Ar>
          </Card>
        )}

        {/* phrases added */}
        <Card tone="plain" aria-labelledby="added-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="added-heading" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <BookmarkCheck className="size-5 text-teal" aria-hidden />
              Added to your phrasebook
            </h2>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {summary.phrasesAdded.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-ink">{p.text}</p>
                  <Ar className="text-sm text-muted">{p.meaningAr}</Ar>
                </div>
                <SpeakButton speaking={speakingId === p.id} onPress={() => hear(p.id, p.text)} label={p.text} size="sm" />
              </li>
            ))}
          </ul>
          <Link
            href="/phrasebook"
            className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-bold text-teal-pressed hover:underline dark:text-teal"
          >
            Open phrasebook
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Card>

        <motion.div variants={rise} className="mt-1 flex flex-col gap-3">
          <ButtonLink href={`/scene/${scene.id}/talk?level=harder`} size="lg" block>
            <TrendingUp className="size-5" aria-hidden />
            Replay at a harder level
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" size="lg" block>
            <Map className="size-5" aria-hidden />
            Back to town
          </ButtonLink>
        </motion.div>
      </motion.div>
    </>
  );
}

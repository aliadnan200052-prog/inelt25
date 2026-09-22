"use client";

import { motion } from "motion/react";
import { Mic, Target } from "lucide-react";
import { useState } from "react";
import { TopBar } from "@/components/nav/TopBar";
import { ButtonLink } from "@/components/ui/Button";
import { Ar, Card, Eyebrow, SectionHeader } from "@/components/ui/primitives";
import { getCharacter } from "@/data/characters";
import { getPlace } from "@/data/places";
import { getScene } from "@/data/scenes";
import { useSpeaker } from "@/lib/hooks/useSpeaker";
import { rise, stagger } from "@/lib/motion";
import { PhraseCard } from "./PhraseCard";
import { ProgressSteps } from "./ProgressSteps";
import { RescueCard } from "./RescueCard";
import { SceneMediaCard } from "./SceneMediaCard";

export function ListenLearnScreen({ sceneId }: { sceneId: string }) {
  const scene = getScene(sceneId)!;
  const character = getCharacter(scene.characterId);
  const place = getPlace(scene.placeId);
  const [listened, setListened] = useState(false);
  const { speak, stop, speakingId } = useSpeaker();

  const hear = (id: string, text: string) =>
    speakingId === id
      ? stop()
      : speak(id, text, { lang: "en-GB", rate: 0.9, preferredVoices: character.voice.preferredNames });

  return (
    <>
      <TopBar title={`${place.name} · with ${character.name}`} fallbackHref="/" icon="close">
        <ProgressSteps current={listened ? 1 : 0} />
      </TopBar>

      <motion.div
        variants={stagger(0.07)}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6 pb-[calc(120px+env(safe-area-inset-bottom))] pt-4"
      >
        <motion.header variants={rise}>
          <Eyebrow>Listen &amp; learn</Eyebrow>
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <h1 className="font-display text-2xl font-semibold text-ink">{scene.title}</h1>
            <Ar className="shrink-0 text-base text-muted">{scene.titleAr}</Ar>
          </div>
        </motion.header>

        <Card tone="teal" className="flex gap-3 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-teal shadow-soft">
            <Target className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-teal-pressed dark:text-teal">Your goal</p>
            <p className="text-base text-ink">{scene.goal}</p>
            <Ar className="text-sm text-muted">{scene.goalAr}</Ar>
          </div>
        </Card>

        <motion.div variants={rise}>
          <SceneMediaCard scene={scene} character={character} onFinished={() => setListened(true)} />
        </motion.div>

        <motion.section variants={rise} aria-labelledby="phrases-heading">
          <SectionHeader
            id="phrases-heading"
            title="Key phrases"
            action={<span className="text-sm text-muted">Tap to hear</span>}
          />
          <motion.ul variants={stagger(0.05)} className="flex flex-col gap-3">
            {scene.keyPhrases.map((p) => (
              <li key={p.id}>
                <PhraseCard phrase={p} speaking={speakingId === p.id} onHear={() => hear(p.id, p.text)} />
              </li>
            ))}
          </motion.ul>
        </motion.section>

        <motion.div variants={rise}>
          <RescueCard
            phrase={scene.rescuePhrase}
            speaking={speakingId === scene.rescuePhrase.id}
            onHear={() => hear(scene.rescuePhrase.id, scene.rescuePhrase.text)}
          />
        </motion.div>
      </motion.div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-cream/90 backdrop-blur-xl pb-safe">
        <div className="mx-auto flex max-w-[640px] flex-col gap-1.5 px-4 pb-3 pt-3">
          <ButtonLink href={`/scene/${scene.id}/talk`} size="lg" block onClick={stop}>
            <Mic className="size-5" aria-hidden />
            I&rsquo;m ready to talk
          </ButtonLink>
          <p className="text-center text-xs text-muted">
            No rush. You can ask {character.name} to repeat anything.
          </p>
        </div>
      </div>
    </>
  );
}

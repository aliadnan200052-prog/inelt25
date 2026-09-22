"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/illustrations/LogoMark";
import { Ar, Pill, SectionHeader } from "@/components/ui/primitives";
import { characters, getCharacter } from "@/data/characters";
import { places } from "@/data/places";
import { getScene, todaysSceneId } from "@/data/scenes";
import { useProgress } from "@/lib/progress";
import { rise, stagger } from "@/lib/motion";
import { CharacterCard } from "./CharacterCard";
import { TodaySceneCard } from "./TodaySceneCard";
import { TownMap } from "./TownMap";

function greetingFor(hour: number) {
  if (hour < 5) return { en: "Good evening", ar: "مساء الخير" };
  if (hour < 12) return { en: "Good morning", ar: "صباح الخير" };
  if (hour < 18) return { en: "Good afternoon", ar: "نهارك سعيد" };
  return { en: "Good evening", ar: "مساء الخير" };
}

export function TownScreen() {
  const progress = useProgress();
  // Time-of-day greeting is computed after mount to avoid hydration drift.
  const [greeting, setGreeting] = useState(greetingFor(9));
  useEffect(() => setGreeting(greetingFor(new Date().getHours())), []);

  const scene = getScene(todaysSceneId)!;
  const character = getCharacter(scene.characterId);
  const townPlaces = places.map((p) => ({
    ...p,
    status: p.sceneId && progress.completedScenes.includes(p.sceneId) ? ("done" as const) : p.status,
  }));
  const openCount = townPlaces.filter((p) => p.status !== "locked").length;

  return (
    <motion.div variants={stagger(0.07)} initial="hidden" animate="show" className="flex flex-col gap-7 pt-3">
      <motion.header variants={rise} className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={34} />
          <span className="font-display text-lg font-semibold tracking-[-0.01em]">Lingo Town</span>
        </div>
        <Pill tone="terra" className="h-8 px-3 text-sm" aria-label={`${progress.streakDays}-day streak`}>
          <Flame className="size-4" strokeWidth={2.2} aria-hidden />
          <span className="tabular">{progress.streakDays}</span>
          <span className="font-medium">days</span>
        </Pill>
      </motion.header>

      <motion.section variants={rise} aria-labelledby="greeting">
        <h1 id="greeting" className="font-display text-2xl font-semibold text-ink">
          {greeting.en}, {progress.learnerName}.
        </h1>
        <p className="mt-1.5 text-base text-muted">One short conversation today. Take your time.</p>
        <Ar className="mt-0.5 text-sm text-muted">{greeting.ar} — محادثة قصيرة واحدة اليوم.</Ar>
      </motion.section>

      <TodaySceneCard
        scene={scene}
        character={character}
        done={progress.completedScenes.includes(scene.id)}
      />

      <motion.section variants={rise} aria-labelledby="town-heading">
        <SectionHeader
          id="town-heading"
          title="Your town"
          action={
            <span className="text-sm text-muted">
              <span className="tabular font-bold text-ink">{openCount}</span> of {townPlaces.length} places open
            </span>
          }
        />
        <TownMap places={townPlaces} highlightPlaceId={scene.placeId} />
      </motion.section>

      <motion.section variants={rise} aria-labelledby="people-heading">
        <SectionHeader id="people-heading" title="People you know" />
        <motion.ul
          variants={stagger(0.05)}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0"
        >
          {characters.map((c) => {
            const place = townPlaces.find((p) => p.id === c.placeId)!;
            return (
              <CharacterCard
                key={c.id}
                character={c}
                placeName={place.name}
                met={place.status !== "locked"}
                href={place.sceneId ? `/scene/${place.sceneId}` : undefined}
              />
            );
          })}
        </motion.ul>
      </motion.section>
    </motion.div>
  );
}

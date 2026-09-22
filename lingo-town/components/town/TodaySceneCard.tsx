"use client";

import { ArrowRight, Clock } from "lucide-react";
import { SceneArt } from "@/components/illustrations/SceneArt";
import { ButtonLink } from "@/components/ui/Button";
import { Ar, Card, Eyebrow, Pill } from "@/components/ui/primitives";
import type { Character, Scene } from "@/data/types";

export function TodaySceneCard({ scene, character, done }: { scene: Scene; character: Character; done?: boolean }) {
  return (
    <Card pad={false} className="overflow-hidden">
      <div className="relative h-40 overflow-hidden border-b border-line sm:h-48">
        <SceneArt placeId={scene.placeId} character={character} className="size-full" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Pill tone="sun" className="shadow-soft">
            <Clock className="size-3" strokeWidth={2.5} aria-hidden />
            {scene.minutes} min
          </Pill>
          <Pill className="bg-surface/90 shadow-soft">{scene.level}</Pill>
        </div>
      </div>
      <div className="p-5">
        <Eyebrow>{done ? "Done today · play again?" : "Today's scene"}</Eyebrow>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">{scene.title}</h2>
          <Ar className="mt-1.5 shrink-0 text-sm text-muted">{scene.titleAr}</Ar>
        </div>
        <p className="mt-1 text-sm text-muted">
          With {character.name}, the {character.role.toLowerCase()}. {scene.goal}
        </p>
        <ButtonLink href={`/scene/${scene.id}`} block size="lg" className="mt-4">
          {done ? "Play it again" : "Start the scene"}
          <ArrowRight className="size-5" aria-hidden />
        </ButtonLink>
      </div>
    </Card>
  );
}

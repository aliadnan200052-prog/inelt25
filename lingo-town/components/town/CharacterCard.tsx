"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Portrait } from "@/components/illustrations/Portrait";
import { Ar } from "@/components/ui/primitives";
import type { Character } from "@/data/types";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { press, rise, spring } from "@/lib/motion";

type Props = { character: Character; placeName: string; href?: string; met: boolean };

export function CharacterCard({ character, placeName, href, met }: Props) {
  const body = (
    <>
      <div className="relative">
        <Portrait
          style={character.portrait}
          size={64}
          bg={met ? "var(--lt-teal-soft)" : "var(--lt-bg-deep)"}
          className={cn(!met && "opacity-60 grayscale-[0.6]")}
        />
      </div>
      <div className="mt-3 min-w-0">
        <p className="truncate font-display text-base font-semibold text-ink">{met ? character.name : "Someone new"}</p>
        <p className="truncate text-xs text-muted">
          {character.role} · {placeName}
        </p>
        <Ar className="mt-0.5 truncate text-xs text-muted">{character.roleAr}</Ar>
      </div>
    </>
  );

  const cls = "flex w-full flex-col rounded-card border border-line bg-surface p-4 text-left shadow-soft";

  return (
    <motion.li variants={rise} className="flex w-[9.25rem] shrink-0 snap-start sm:w-auto">
      {href && met ? (
        <motion.div whileTap={press} transition={spring} className="flex w-full">
          <Link href={href} className={cn(cls, "hover:border-line-strong")} onClick={() => haptic("tap")}>
            {body}
          </Link>
        </motion.div>
      ) : (
        <div className={cls} aria-label={`${character.role} at the ${placeName}. Not met yet.`}>
          {body}
        </div>
      )}
    </motion.li>
  );
}

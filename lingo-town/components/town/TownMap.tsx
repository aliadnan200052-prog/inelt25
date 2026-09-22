"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { buildingFor, Tree } from "@/components/illustrations/Buildings";
import type { Place } from "@/data/types";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

const VW = 360;
const VH = 300;

type Props = {
  places: (Place & { status: Place["status"] })[];
  highlightPlaceId?: string;
};

/** Illustrated town map with accessible, tappable place markers. */
export function TownMap({ places, highlightPlaceId }: Props) {
  const [notice, setNotice] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(t);
  }, [notice]);

  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="@container relative aspect-[6/5] w-full">
        <MapArt places={places} />

        <ul className="absolute inset-0" aria-label="Places in town">
          {places.map((p) => {
            const locked = p.status === "locked";
            const done = p.status === "done";
            const today = p.id === highlightPlaceId;
            const marker = (
              <>
                {/* invisible hit area over the building; scales with the map */}
                <span aria-hidden className="block h-[15.5cqw] w-[18cqw] min-w-16" />
                <span
                  className={cn(
                    "relative inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold shadow-soft transition-colors",
                    locked
                      ? "border-line bg-surface/90 text-muted"
                      : today
                        ? "border-teal bg-teal text-on-teal"
                        : "border-line bg-surface text-ink group-hover:border-teal/40",
                  )}
                >
                  {today && (
                    <span aria-hidden className="lt-pulse absolute inset-0 -z-10 rounded-full" />
                  )}
                  {locked && <Lock className="size-3" strokeWidth={2.5} aria-hidden />}
                  {done && <Check className="size-3.5 text-teal" strokeWidth={3} aria-hidden />}
                  {p.name}
                </span>
              </>
            );

            return (
              <li
                key={p.id}
                className="absolute flex flex-col items-center"
                style={{ left: `${p.map.x}%`, top: `${p.map.y}%`, transform: "translate(-50%, -15.5cqw)" }}
              >
                {locked ? (
                  <button
                    type="button"
                    className="group flex flex-col items-center rounded-2xl"
                    aria-label={`${p.name}, locked. ${p.unlockHint ?? ""}`}
                    onClick={() => {
                      haptic("soft");
                      setNotice({ id: p.id, text: p.unlockHint ?? "Coming soon" });
                    }}
                  >
                    {marker}
                  </button>
                ) : (
                  <Link
                    href={`/scene/${p.sceneId}`}
                    className="group flex flex-col items-center rounded-2xl"
                    aria-label={`${p.name}${today ? ", today's scene" : ""}${done ? ", completed" : ""}`}
                    onClick={() => haptic("tap")}
                  >
                    {marker}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
          <AnimatePresence>
            {notice && (
              <motion.p
                key={notice.id}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6 }}
                transition={spring}
                className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream shadow-lift"
              >
                <Lock className="size-3.5" aria-hidden />
                {notice.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MapArt({ places }: { places: Place[] }) {
  const pos = (p: Place) => ({ x: (p.map.x / 100) * VW, y: (p.map.y / 100) * VH });
  const plaza = { x: 180, y: 168 };

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="absolute inset-0 size-full" aria-hidden>
      {/* ground */}
      <rect width={VW} height={VH} fill="var(--lt-leaf-soft)" />
      <path d="M0 0H360V70C300 92 240 60 180 74C120 88 60 60 0 80Z" fill="var(--lt-sky)" opacity="0.7" />
      <path d="M-10 60C40 44 70 70 120 58C170 46 200 30 250 42C300 54 330 40 370 46V-10H-10Z" fill="var(--lt-sky)" />
      {/* distant hills */}
      <path d="M-10 64C30 40 70 44 100 58C130 40 170 36 200 52C240 30 300 34 370 56V80H-10Z" fill="var(--lt-leaf)" opacity="0.28" />
      {/* river */}
      <path d="M230 300C250 282 292 286 318 268C338 254 350 250 370 248V300Z" fill="var(--lt-teal-soft)" />
      <path d="M262 292C282 284 300 282 318 274" stroke="#FFFDF8" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* grass texture */}
      {[
        [40, 120],
        [140, 110],
        [312, 136],
        [210, 240],
        [44, 210],
        [300, 176],
        [128, 214],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y}l2-5 2 5m3 0l2-4 2 4`} stroke="var(--lt-leaf)" strokeWidth="1.3" fill="none" opacity="0.55" strokeLinecap="round" />
      ))}

      {/* roads: an outline stroke under a cream stroke */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {roads(places, plaza).map((d, i) => (
          <path key={`o${i}`} d={d} stroke="var(--lt-border-strong)" strokeWidth="17" />
        ))}
        {roads(places, plaza).map((d, i) => (
          <path key={`r${i}`} d={d} stroke="var(--lt-bg)" strokeWidth="13" />
        ))}
        {roads(places, plaza).map((d, i) => (
          <path key={`d${i}`} d={d} stroke="var(--lt-border-strong)" strokeWidth="1.4" strokeDasharray="3 7" opacity="0.8" />
        ))}
      </g>

      {/* plaza with fountain */}
      <circle cx={plaza.x} cy={plaza.y} r="24" fill="var(--lt-bg)" stroke="var(--lt-border-strong)" strokeWidth="2" />
      <circle cx={plaza.x} cy={plaza.y} r="11" fill="var(--lt-teal-soft)" stroke="var(--lt-teal)" strokeWidth="2" />
      <circle cx={plaza.x} cy={plaza.y - 1} r="3" fill="var(--lt-teal)" />

      {/* trees */}
      {(
        [
          [32, 104, 1, 0],
          [52, 94, 0.8, 1],
          [128, 104, 0.85, 1],
          [228, 96, 0.8, 0],
          [326, 92, 1, 1],
          [340, 170, 0.85, 0],
          [212, 262, 0.85, 1],
          [158, 290, 0.8, 0],
          [26, 176, 0.9, 1],
          [312, 250, 0.75, 0],
          [136, 200, 0.75, 0],
        ] as const
      ).map(([x, y, s, t]) => (
        <Tree key={`${x}-${y}`} x={x} y={y} s={s} tone={t} />
      ))}

      {/* lamp posts */}
      {[
        [150, 150],
        [214, 186],
      ].map(([x, y]) => (
        <g key={`l${x}`} transform={`translate(${x} ${y})`}>
          <rect x="-0.9" y="-16" width="1.8" height="16" fill="var(--lt-ink)" opacity="0.55" />
          <circle cx="0" cy="-17" r="2.8" fill="var(--lt-sun)" />
        </g>
      ))}

      {/* buildings */}
      {places.map((p) => {
        const B = buildingFor[p.id];
        if (!B) return null;
        const { x, y } = pos(p);
        const locked = p.status === "locked";
        return (
          <g
            key={p.id}
            transform={`translate(${x} ${y - 12})`}
            style={locked ? { filter: "saturate(0.35)", opacity: 0.72 } : undefined}
          >
            <B />
          </g>
        );
      })}
    </svg>
  );
}

function roads(places: Place[], plaza: { x: number; y: number }) {
  return places.map((p) => {
    const x = (p.map.x / 100) * VW;
    const y = (p.map.y / 100) * VH - 8;
    const mx = (x + plaza.x) / 2;
    return `M${plaza.x} ${plaza.y} C${mx} ${plaza.y} ${x} ${(y + plaza.y) / 2} ${x} ${y}`;
  });
}

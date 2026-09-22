"use client";

import { motion, useReducedMotion } from "motion/react";

/** Illustrated reward for the Review hero: the thing you came for. */
export function SuccessBadge({ placeId }: { placeId: string }) {
  const reduce = useReducedMotion();
  const sparks = [
    { x: -62, y: -30, c: "var(--lt-sun)", r: 5 },
    { x: 60, y: -40, c: "var(--lt-terra)", r: 4 },
    { x: 70, y: 18, c: "var(--lt-teal)", r: 5 },
    { x: -66, y: 30, c: "var(--lt-teal)", r: 3.5 },
    { x: -30, y: -66, c: "var(--lt-terra)", r: 3 },
    { x: 34, y: 62, c: "var(--lt-sun)", r: 3.5 },
  ];

  return (
    <div className="relative mx-auto grid size-40 place-items-center" aria-hidden>
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: s.r * 2, height: s.r * 2, background: s.c, left: "50%", top: "50%" }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{ x: s.x, y: s.y, opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 12, delay: 0.25 + i * 0.04 }}
        />
      ))}
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        className="grid size-32 place-items-center rounded-full border border-line bg-surface shadow-lift"
      >
        <svg viewBox="0 0 96 96" className="size-24">
          <circle cx="48" cy="48" r="44" fill="var(--lt-teal-soft)" />
          {placeId === "bakery" ? (
            <g>
              <ellipse cx="48" cy="66" rx="30" ry="5" fill="#000" opacity="0.08" />
              <path d="M20 58C20 38 34 30 48 30C62 30 76 38 76 58C76 63 72 66 66 66H30C24 66 20 63 20 58Z" fill="#C48A4E" />
              <path d="M30 44l6 6M42 38l6 6M54 38l6 6M64 44l4 4" stroke="#8A5A32" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <ellipse cx="46" cy="76" rx="24" ry="4" fill="#000" opacity="0.08" />
              <path d="M28 36H64L60 74C60 76 58 78 56 78H36C34 78 32 76 32 74Z" fill="#FFFDF8" stroke="#1F2A2E" strokeOpacity="0.15" />
              <rect x="25" y="30" width="42" height="8" rx="3" fill="var(--lt-terra)" />
              <rect x="31" y="48" width="30" height="14" rx="2" fill="var(--lt-teal)" />
              <path d="M40 55H52" stroke="#FFFDF8" strokeWidth="2.4" strokeLinecap="round" />
              <g stroke="#1F2A2E" strokeOpacity="0.28" strokeWidth="2.4" strokeLinecap="round" fill="none">
                <path d="M40 24C37 20 43 17 40 12" />
                <path d="M52 24C49 20 55 17 52 12" />
              </g>
            </g>
          )}
        </svg>
      </motion.div>
    </div>
  );
}

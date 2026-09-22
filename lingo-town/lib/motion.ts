import type { Transition, Variants } from "motion/react";

export const spring: Transition = { type: "spring", stiffness: 420, damping: 32, mass: 0.8 };
export const softSpring: Transition = { type: "spring", stiffness: 260, damping: 28 };
export const easeOut: Transition = { duration: 0.42, ease: [0.22, 1, 0.36, 1] };

/** Parent for staggered card entrances. */
export const stagger = (delay = 0.06, delayChildren = 0.04): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren } },
});

export const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

/** Springy press used by every tappable surface. */
export const press = { scale: 0.97 };

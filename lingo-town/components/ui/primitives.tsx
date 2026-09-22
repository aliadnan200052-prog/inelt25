"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { press, rise, spring } from "@/lib/motion";

/* ---------------------------------- Card --------------------------------- */

type CardProps = HTMLMotionProps<"div"> & { tone?: "surface" | "teal" | "terra" | "sun" | "plain"; pad?: boolean };

const tones = {
  surface: "bg-surface border border-line shadow-card",
  teal: "bg-teal-soft border border-teal/15",
  terra: "bg-terra-soft border border-terra/20",
  sun: "bg-sun-soft border border-sun/30",
  plain: "bg-surface-2 border border-line",
};

/** Base surface. Participates in parent stagger via the `rise` variant. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { tone = "surface", pad = true, className, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      variants={rise}
      className={cn("rounded-card", tones[tone], pad && "p-5", className)}
      {...rest}
    />
  );
});

/* ------------------------------ Arabic text ------------------------------ */

type ArProps = React.HTMLAttributes<HTMLElement> & { as?: "p" | "span" | "div" };

/** Arabic helper text — always lang="ar" dir="rtl" with the Arabic face. */
export function Ar({ as: Tag = "p", className, ...rest }: ArProps) {
  return <Tag lang="ar" dir="rtl" className={cn("font-arabic leading-relaxed", className)} {...rest} />;
}

/* -------------------------------- Chip ----------------------------------- */

type ChipProps = Omit<HTMLMotionProps<"button">, "children"> & {
  icon?: React.ReactNode;
  active?: boolean;
  children?: React.ReactNode;
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { icon, active, className, children, onClick, type = "button", ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={press}
      transition={spring}
      onClick={(e) => {
        haptic("soft");
        onClick?.(e);
      }}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? "border-teal/30 bg-teal-soft text-teal-pressed dark:text-teal"
          : "border-line bg-surface text-ink shadow-soft hover:border-line-strong",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  );
});

/* ------------------------------ IconButton ------------------------------- */

type IconButtonProps = HTMLMotionProps<"button"> & { label: string; tone?: "surface" | "teal" | "clear" };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tone = "surface", className, onClick, type = "button", children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.92 }}
      transition={spring}
      onClick={(e) => {
        haptic("soft");
        onClick?.(e);
      }}
      className={cn(
        "inline-grid size-11 shrink-0 place-items-center rounded-full transition-colors",
        tone === "surface" && "border border-line bg-surface text-ink shadow-soft hover:border-line-strong",
        tone === "teal" && "bg-teal-soft text-teal-pressed hover:bg-teal hover:text-on-teal dark:text-teal",
        tone === "clear" && "text-ink hover:bg-ink/5",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

/* ------------------------------- Pill ------------------------------------ */

export function Pill({
  tone = "neutral",
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "teal" | "terra" | "sun" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide",
        tone === "neutral" && "bg-cream-deep text-muted",
        tone === "teal" && "bg-teal-soft text-teal-pressed dark:text-teal",
        tone === "terra" && "bg-terra-soft text-terra-deep",
        tone === "sun" && "bg-sun-soft text-[#6b4d0c] dark:text-sun",
        className,
      )}
      {...rest}
    />
  );
}

/* ---------------------------- Section header ----------------------------- */

export function SectionHeader({
  title,
  action,
  className,
  id,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <h2 id={id} className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">
        {title}
      </h2>
      {action}
    </div>
  );
}

/* ------------------------------ Eyebrow ---------------------------------- */

export function Eyebrow({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs font-bold uppercase tracking-[0.12em] text-terra-deep", className)}
      {...rest}
    />
  );
}

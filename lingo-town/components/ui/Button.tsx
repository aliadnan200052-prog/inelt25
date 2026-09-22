"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { press, spring } from "@/lib/motion";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "soft";
type Size = "lg" | "md" | "sm";

const base =
  "relative inline-flex select-none items-center whitespace-nowrap justify-center gap-2 rounded-btn font-sans font-bold tracking-[-0.005em] transition-[background-color,box-shadow,color] duration-200 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-teal text-on-teal shadow-teal hover:bg-teal-pressed active:bg-teal-pressed",
  accent: "bg-terra text-white shadow-card hover:bg-terra-deep active:bg-terra-deep dark:text-[#1a0f0a]",
  secondary: "border border-line bg-surface text-ink shadow-soft hover:border-line-strong",
  soft: "bg-teal-soft text-teal-pressed hover:brightness-[0.98] dark:text-teal",
  ghost: "text-teal-pressed hover:bg-teal-soft/60 dark:text-teal",
};

const sizes: Record<Size, string> = {
  lg: "h-14 px-6 text-base",
  md: "h-12 px-5 text-base",
  sm: "h-11 px-4 text-sm",
};

export type ButtonStyleProps = { variant?: Variant; size?: Size; block?: boolean };

export const buttonClass = ({ variant = "primary", size = "md", block }: ButtonStyleProps) =>
  cn(base, variants[variant], sizes[size], block && "w-full");

type ButtonProps = HTMLMotionProps<"button"> & ButtonStyleProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, block, className, onClick, type = "button", ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={press}
      transition={spring}
      onClick={(e) => {
        haptic("tap");
        onClick?.(e);
      }}
      className={cn(buttonClass({ variant, size, block }), className)}
      {...rest}
    />
  );
});

const MotionLink = motion.create(Link);

type ButtonLinkProps = React.ComponentProps<typeof MotionLink> & ButtonStyleProps;

export function ButtonLink({ variant, size, block, className, onClick, ...rest }: ButtonLinkProps) {
  return (
    <MotionLink
      whileTap={press}
      transition={spring}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
        haptic("tap");
        onClick?.(e);
      }}
      className={cn(buttonClass({ variant, size, block }), className)}
      {...rest}
    />
  );
}

export { MotionLink };

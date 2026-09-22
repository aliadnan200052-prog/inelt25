"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { BookOpen, CircleUserRound, Map } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

const tabs = [
  { href: "/", label: "Town", Icon: Map },
  { href: "/phrasebook", label: "Phrasebook", Icon: BookOpen },
  { href: "/me", label: "Me", Icon: CircleUserRound },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-surface/85 backdrop-blur-xl backdrop-saturate-150 pb-safe"
    >
      <ul className="mx-auto grid h-[68px] max-w-[640px] grid-cols-3 px-3">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => haptic("soft")}
                className={cn(
                  "relative m-1.5 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-bold transition-colors",
                  active ? "text-teal-pressed dark:text-teal" : "text-muted hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    transition={spring}
                    className="absolute inset-x-3 inset-y-0.5 -z-10 rounded-2xl bg-teal-soft"
                  />
                )}
                <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

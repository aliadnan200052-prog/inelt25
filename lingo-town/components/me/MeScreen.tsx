"use client";

import { motion } from "motion/react";
import { BookOpen, Flame, Info, Monitor, Moon, RotateCcw, Sun, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Ar, Card, SectionHeader } from "@/components/ui/primitives";
import { scenes } from "@/data/scenes";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { rise, spring, stagger } from "@/lib/motion";
import { resetProgress, useProgress } from "@/lib/progress";
import { setTheme, useTheme, type ThemePref } from "@/lib/theme";

const themes: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: "system", label: "Auto", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function MeScreen() {
  const progress = useProgress();
  const theme = useTheme();
  const saved = Object.keys(progress.saved).length;

  const stats = [
    { label: "Day streak", value: progress.streakDays, Icon: Flame, tone: "text-terra" },
    { label: "Scenes done", value: `${progress.completedScenes.length}/${scenes.length}`, Icon: Trophy, tone: "text-sun" },
    { label: "Phrases", value: saved, Icon: BookOpen, tone: "text-teal" },
  ];

  return (
    <motion.div variants={stagger(0.07)} initial="hidden" animate="show" className="flex flex-col gap-7 pt-6">
      <motion.header variants={rise} className="flex items-center gap-4">
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-full bg-teal font-display text-2xl font-semibold text-on-teal shadow-teal"
        >
          {progress.learnerName.charAt(0)}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink">{progress.learnerName}</h1>
          <p className="text-sm text-muted">Level A2 · Baghdad</p>
        </div>
      </motion.header>

      <motion.ul variants={rise} className="grid grid-cols-3 gap-3" aria-label="Your progress">
        {stats.map(({ label, value, Icon, tone }) => (
          <li key={label} className="rounded-card border border-line bg-surface p-4 shadow-soft">
            <Icon className={cn("size-5", tone)} aria-hidden />
            <p className="tabular mt-2 font-display text-xl font-semibold text-ink">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </li>
        ))}
      </motion.ul>

      <motion.section variants={rise} aria-labelledby="appearance">
        <SectionHeader id="appearance" title="Appearance" />
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-btn border border-line bg-surface-2 p-1">
          {themes.map(({ value, label, Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  haptic("soft");
                  setTheme(value);
                }}
                className={cn(
                  "relative flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {active && (
                  <motion.span layoutId="theme-pill" transition={spring} className="absolute inset-0 rounded-xl bg-surface shadow-soft" />
                )}
                <Icon className="relative size-4" aria-hidden />
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
      </motion.section>

      <Card tone="plain" className="flex gap-3 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">Preview build</p>
          <p className="text-sm text-muted">
            Conversations are scripted and voices use your device&rsquo;s speech engine. Real speech recognition and AI
            replies plug in next.
          </p>
          <Ar className="mt-1 text-sm text-muted">نسخة تجريبية: المحادثات مُعدّة مسبقاً في هذه المرحلة.</Ar>
        </div>
      </Card>

      <motion.div variants={rise}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm("Reset your progress on this device?")) resetProgress();
          }}
        >
          <RotateCcw className="size-4" aria-hidden />
          Reset progress on this device
        </Button>
      </motion.div>
    </motion.div>
  );
}

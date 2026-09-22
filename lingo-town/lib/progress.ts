"use client";

/**
 * Learner progress, stored locally for now. The public functions are the
 * seam for Supabase later: keep their signatures, change the storage.
 */
import { useSyncExternalStore } from "react";
import type { SessionSummary } from "@/data/types";

export type SavedPhrase = {
  phraseId: string;
  addedAt: number;
  /** When the phrase is next due for review (spaced repetition). */
  dueAt: number;
  /** Consecutive successful reviews, drives the interval. */
  box: number;
};

export type Progress = {
  learnerName: string;
  streakDays: number;
  completedScenes: string[];
  saved: Record<string, SavedPhrase>;
  lastSession: Record<string, SessionSummary>;
};

const KEY = "lingo-town:progress:v1";
const DAY = 86_400_000;
/** Review intervals per box, in days (Leitner-style). */
const INTERVALS = [0, 1, 3, 7, 16, 35];

const seed = (now: number): Progress => ({
  learnerName: "Ali",
  streakDays: 4,
  completedScenes: [],
  saved: {
    "bakery-recommend": { phraseId: "bakery-recommend", addedAt: now - 3 * DAY, dueAt: now - DAY, box: 1 },
    "bakery-ill-take": { phraseId: "bakery-ill-take", addedAt: now - 3 * DAY, dueAt: now + 2 * DAY, box: 2 },
    "cafe-say-again": { phraseId: "cafe-say-again", addedAt: now - 5 * DAY, dueAt: now - 2 * DAY, box: 1 },
  },
  lastSession: {},
});

// A fixed timestamp keeps server and first client render identical.
const SERVER_SNAPSHOT = seed(Date.UTC(2026, 0, 1));

let state: Progress | null = null;
const listeners = new Set<() => void>();

function load(): Progress {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? { ...seed(Date.now()), ...JSON.parse(raw) } : seed(Date.now());
  } catch {
    state = seed(Date.now());
  }
  return state!;
}

function commit(next: Progress) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode or quota: keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, load, () => SERVER_SNAPSHOT);
}

export function savePhrases(ids: string[]) {
  const p = load();
  const now = Date.now();
  const saved = { ...p.saved };
  for (const id of ids) {
    if (!saved[id]) saved[id] = { phraseId: id, addedAt: now, dueAt: now + DAY, box: 1 };
  }
  commit({ ...p, saved });
}

export function reviewPhrase(id: string, remembered: boolean) {
  const p = load();
  const cur = p.saved[id];
  if (!cur) return;
  const box = remembered ? Math.min(cur.box + 1, INTERVALS.length - 1) : 1;
  const dueAt = Date.now() + INTERVALS[box] * DAY;
  commit({ ...p, saved: { ...p.saved, [id]: { ...cur, box, dueAt } } });
}

export function completeScene(summary: SessionSummary) {
  const p = load();
  const completedScenes = p.completedScenes.includes(summary.sceneId)
    ? p.completedScenes
    : [...p.completedScenes, summary.sceneId];
  commit({ ...p, completedScenes, lastSession: { ...p.lastSession, [summary.sceneId]: summary } });
  savePhrases(summary.phrasesAdded.map((ph) => ph.id));
}

export function resetProgress() {
  commit(seed(Date.now()));
}

export const isDue = (s: SavedPhrase, now = Date.now()) => s.dueAt <= now;

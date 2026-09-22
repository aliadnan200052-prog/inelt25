"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY as KEY } from "./theme-boot";

export type ThemePref = "system" | "light" | "dark";
const listeners = new Set<() => void>();

function read(): ThemePref {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

export function setTheme(t: ThemePref) {
  const root = document.documentElement;
  if (t === "system") delete root.dataset.theme;
  else root.dataset.theme = t;
  try {
    if (t === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useTheme(): ThemePref {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => "system",
  );
}

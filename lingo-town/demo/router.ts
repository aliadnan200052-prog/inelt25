/**
 * In-memory router for the single-file demo. The artifact frame can't
 * route by URL, so paths live here; a bare #anchor can pick the start screen.
 */
import { useSyncExternalStore } from "react";

type Entry = { path: string; search: string };

const deepLinks: Record<string, string> = {
  town: "/",
  learn: "/scene/cafe-order",
  talk: "/scene/cafe-order/talk",
  review: "/scene/cafe-order/review",
  bakery: "/scene/bakery-bread",
  phrasebook: "/phrasebook",
  me: "/me",
};

function parse(href: string): Entry {
  const [path, search = ""] = href.split("?");
  return { path: path || "/", search };
}

const start = typeof location !== "undefined" ? deepLinks[location.hash.slice(1)] : undefined;
let stack: Entry[] = [parse(start ?? "/")];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function navigate(href: string, mode: "push" | "replace" = "push") {
  const next = parse(href);
  stack = mode === "replace" ? [...stack.slice(0, -1), next] : [...stack, next];
  window.scrollTo(0, 0);
  emit();
}

export function back() {
  stack = stack.length > 1 ? stack.slice(0, -1) : [parse("/")];
  window.scrollTo(0, 0);
  emit();
}

export const canGoBack = () => stack.length > 1;

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useLocation(): Entry {
  return useSyncExternalStore(
    subscribe,
    () => stack[stack.length - 1],
    () => stack[stack.length - 1],
  );
}

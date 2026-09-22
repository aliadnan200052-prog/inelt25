"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** False during SSR and hydration, true afterwards (for time-relative UI). */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * Haptic-style micro-feedback. Uses the Vibration API where supported
 * (Android Chrome); a silent no-op elsewhere (iOS Safari has no API).
 */
type Pattern = "tap" | "press" | "success" | "soft";

const patterns: Record<Pattern, number | number[]> = {
  tap: 8,
  soft: 5,
  press: 14,
  success: [10, 60, 18],
};

export function haptic(kind: Pattern = "tap") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  // Browsers reject vibration before the first user gesture.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try {
    navigator.vibrate(patterns[kind]);
  } catch {
    /* ignore */
  }
}

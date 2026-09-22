"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { textToSpeech, type Playback, type TextToSpeechOptions } from "@/lib/services";

/**
 * Plays one utterance at a time and exposes which item is speaking,
 * so buttons can show a live "speaking" state.
 */
export function useSpeaker() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const current = useRef<Playback | null>(null);
  const token = useRef(0);

  const stop = useCallback(() => {
    token.current++;
    current.current?.stop();
    current.current = null;
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    async (id: string, text: string, opts?: TextToSpeechOptions) => {
      stop();
      const mine = ++token.current;
      setSpeakingId(id);
      const pb = textToSpeech(text, opts);
      current.current = pb;
      await pb.finished;
      if (token.current === mine) {
        current.current = null;
        setSpeakingId(null);
      }
      return token.current === mine;
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { speak, stop, speakingId };
}

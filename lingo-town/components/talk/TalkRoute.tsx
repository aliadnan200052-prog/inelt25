"use client";

import { useSearchParams } from "next/navigation";
import { TalkScreen } from "./TalkScreen";

/** Reads `?level=harder` on the client so the route stays static. */
export function TalkRoute({ sceneId }: { sceneId: string }) {
  const level = useSearchParams().get("level");
  return <TalkScreen key={level ?? "normal"} sceneId={sceneId} harder={level === "harder"} />;
}

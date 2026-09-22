import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TalkScreen } from "@/components/talk/TalkScreen";
import { getScene, scenes } from "@/data/scenes";

export function generateStaticParams() {
  return scenes.map((s) => ({ sceneId: s.id }));
}

export const metadata: Metadata = { title: "Talk" };

export default async function TalkPage({ params, searchParams }: PageProps<"/scene/[sceneId]/talk">) {
  const { sceneId } = await params;
  const { level } = await searchParams;
  if (!getScene(sceneId)) notFound();
  return <TalkScreen key={String(level)} sceneId={sceneId} harder={level === "harder"} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TalkRoute } from "@/components/talk/TalkRoute";
import { getScene, scenes } from "@/data/scenes";

export function generateStaticParams() {
  return scenes.map((s) => ({ sceneId: s.id }));
}

export const metadata: Metadata = { title: "Talk" };

export default async function TalkPage({ params }: PageProps<"/scene/[sceneId]/talk">) {
  const { sceneId } = await params;
  if (!getScene(sceneId)) notFound();
  return (
    <Suspense>
      <TalkRoute sceneId={sceneId} />
    </Suspense>
  );
}

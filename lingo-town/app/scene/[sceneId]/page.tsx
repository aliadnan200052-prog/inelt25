import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListenLearnScreen } from "@/components/scene/ListenLearnScreen";
import { getScene, scenes } from "@/data/scenes";

export function generateStaticParams() {
  return scenes.map((s) => ({ sceneId: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/scene/[sceneId]">): Promise<Metadata> {
  const { sceneId } = await params;
  return { title: getScene(sceneId)?.title ?? "Scene" };
}

export default async function ScenePage({ params }: PageProps<"/scene/[sceneId]">) {
  const { sceneId } = await params;
  if (!getScene(sceneId)) notFound();
  return <ListenLearnScreen sceneId={sceneId} />;
}

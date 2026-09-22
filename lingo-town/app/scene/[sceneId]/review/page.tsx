import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewScreen } from "@/components/review/ReviewScreen";
import { getScene, scenes } from "@/data/scenes";

export function generateStaticParams() {
  return scenes.map((s) => ({ sceneId: s.id }));
}

export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage({ params }: PageProps<"/scene/[sceneId]/review">) {
  const { sceneId } = await params;
  if (!getScene(sceneId)) notFound();
  return <ReviewScreen sceneId={sceneId} />;
}

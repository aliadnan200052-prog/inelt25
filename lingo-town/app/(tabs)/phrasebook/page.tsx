import type { Metadata } from "next";
import { PhrasebookScreen } from "@/components/phrasebook/PhrasebookScreen";

export const metadata: Metadata = { title: "Phrasebook" };

export default function PhrasebookPage() {
  return <PhrasebookScreen />;
}

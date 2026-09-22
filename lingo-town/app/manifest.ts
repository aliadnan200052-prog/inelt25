import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Lingo Town — speak English with confidence",
    short_name: "Lingo Town",
    description: "Practise real English conversations in a cozy little town.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F1E7",
    theme_color: "#F6F1E7",
    lang: "en",
    dir: "ltr",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Today's scene", url: "/scene/cafe-order", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Phrasebook", url: "/phrasebook", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}

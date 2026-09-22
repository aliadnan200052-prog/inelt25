import type { Character } from "./types";

export const characters: Character[] = [
  {
    id: "maya",
    name: "Maya",
    role: "Barista",
    roleAr: "صانعة القهوة",
    placeId: "cafe",
    blurb: "Warm, a bit chatty, remembers your order.",
    portrait: { skin: "#E7B98F", hair: "#3B2A22", hairStyle: "bun", outfit: "#2F6B66", accent: "#C0562F" },
    voice: { lang: "en-GB", pitch: 1.1, rate: 0.95, preferredNames: ["Google UK English Female", "Serena", "Kate"] },
  },
  {
    id: "ben",
    name: "Ben",
    role: "Baker",
    roleAr: "الخبّاز",
    placeId: "bakery",
    blurb: "Up since 4am. Loves talking about bread.",
    portrait: { skin: "#C98E68", hair: "#6B4A33", hairStyle: "short", outfit: "#C0562F", accent: "#FBEBDD", beard: true },
    voice: { lang: "en-US", pitch: 0.9, rate: 0.95, preferredNames: ["Google US English", "Alex", "Daniel"] },
  },
  {
    id: "grace",
    name: "Grace",
    role: "Pharmacist",
    roleAr: "الصيدلانية",
    placeId: "pharmacy",
    blurb: "Patient, precise, explains things twice.",
    portrait: { skin: "#8D5A3B", hair: "#1F1A17", hairStyle: "curly", outfit: "#FFFDF8", accent: "#2F6B66", glasses: true },
    voice: { lang: "en-US", pitch: 1.05, rate: 0.9 },
  },
  {
    id: "sam",
    name: "Sam",
    role: "Station clerk",
    roleAr: "موظف المحطة",
    placeId: "station",
    blurb: "Quick and friendly. Knows every timetable.",
    portrait: { skin: "#F0C9A4", hair: "#B0703A", hairStyle: "short", outfit: "#1F2A2E", accent: "#E9B949" },
    voice: { lang: "en-GB", pitch: 1, rate: 1 },
  },
  {
    id: "noor",
    name: "Noor",
    role: "Hotel receptionist",
    roleAr: "موظفة الاستقبال",
    placeId: "hotel",
    blurb: "Calm and helpful. Also speaks Arabic, but won't.",
    portrait: { skin: "#D9A57C", hair: "#6F8F5B", hairStyle: "hijab", outfit: "#8E3A1C", accent: "#F7E7BD" },
    voice: { lang: "en-GB", pitch: 1.05, rate: 0.95 },
  },
];

export const getCharacter = (id: string) => {
  const c = characters.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown character: ${id}`);
  return c;
};

import type { Place } from "./types";

/** Map coordinates: each building's base point, as % of the 360×300 map. */
export const places: Place[] = [
  { id: "cafe", name: "Café", nameAr: "المقهى", status: "open", sceneId: "cafe-order", map: { x: 25.6, y: 44 } },
  { id: "bakery", name: "Bakery", nameAr: "المخبز", status: "open", sceneId: "bakery-bread", map: { x: 74.4, y: 36.7 } },
  {
    id: "pharmacy",
    name: "Pharmacy",
    nameAr: "الصيدلية",
    status: "locked",
    unlockHint: "Finish the café and bakery",
    map: { x: 72.8, y: 71.3 },
  },
  {
    id: "station",
    name: "Station",
    nameAr: "المحطة",
    status: "locked",
    unlockHint: "Unlocks in week 2",
    map: { x: 25.6, y: 82 },
  },
  {
    id: "hotel",
    name: "Hotel",
    nameAr: "الفندق",
    status: "locked",
    unlockHint: "Unlocks in week 3",
    map: { x: 50, y: 29.5 },
  },
];

export const getPlace = (id: string) => {
  const p = places.find((p) => p.id === id);
  if (!p) throw new Error(`Unknown place: ${id}`);
  return p;
};

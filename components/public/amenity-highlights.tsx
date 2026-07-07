import {
  Wifi,
  Waves,
  Flame,
  Beef,
  PlugZap,
  Car,
  Tv,
  UtensilsCrossed,
  WashingMachine,
  PawPrint,
  Baby,
  Trees,
  Laptop,
  Snowflake,
  Sun,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";

import { AMENITY_LABELS } from "@/lib/amenities";

/** De mest «selgende» fasilitetene får eget ikon, vist som pene brikker. */
const HIGHLIGHT_ICONS: Record<string, LucideIcon> = {
  boblebad: Waves,
  badstue: Flame,
  peis: Flame,
  grill: Beef,
  wifi: Wifi,
  lademulighet: PlugZap,
  gratis_parkering: Car,
  parkering: Car,
  tv: Tv,
  kjokken: UtensilsCrossed,
  vaskemaskin: WashingMachine,
  kjaeledyr: PawPrint,
  barnevennlig: Baby,
  terrasse: Trees,
  hage: Trees,
  arbeidsplass: Laptop,
  aircondition: Snowflake,
  solseng: Sun,
  treningsutstyr: Dumbbell,
};

// Rekkefølge på hva vi helst viser først når det er mange treff.
const PRIORITY = [
  "boblebad",
  "badstue",
  "peis",
  "wifi",
  "grill",
  "lademulighet",
  "kjokken",
  "terrasse",
  "tv",
  "barnevennlig",
  "kjaeledyr",
  "parkering",
];

/** Rad med de viktigste fasilitetene som ikon-brikker (Airbnb-følelse). */
export function AmenityHighlights({ amenities }: { amenities: string[] }) {
  const set = new Set(amenities);
  const keys = [
    ...PRIORITY.filter((k) => set.has(k) && HIGHLIGHT_ICONS[k]),
    ...amenities.filter(
      (k) => HIGHLIGHT_ICONS[k] && !PRIORITY.includes(k),
    ),
  ].slice(0, 10);

  if (keys.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {keys.map((key) => {
        const Icon = HIGHLIGHT_ICONS[key];
        return (
          <span
            key={key}
            className="flex items-center gap-2 rounded-full border border-hairline bg-white px-3.5 py-2 text-sm font-medium text-navy shadow-sm"
          >
            <Icon className="h-4 w-4 text-gold" />
            {AMENITY_LABELS[key] ?? key}
          </span>
        );
      })}
    </div>
  );
}

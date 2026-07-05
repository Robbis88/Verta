import {
  Wifi,
  Car,
  UtensilsCrossed,
  WashingMachine,
  Shirt,
  Utensils,
  Tv,
  Thermometer,
  Bath,
  Flame,
  Sun,
  Snowflake,
  Dog,
  Baby,
  Check,
  type LucideIcon,
} from "lucide-react";

import { AMENITY_LABELS } from "@/lib/amenities";

const ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  parkering: Car,
  kjokken: UtensilsCrossed,
  vaskemaskin: WashingMachine,
  torketrommel: Shirt,
  oppvaskmaskin: Utensils,
  tv: Tv,
  badstue: Thermometer,
  boblebad: Bath,
  peis: Flame,
  terrasse: Sun,
  aircondition: Snowflake,
  kjaeledyr: Dog,
  barnevennlig: Baby,
};

/** Fasiliteter som et ikon-rutenett på den offentlige booking-siden. */
export function AmenityList({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {amenities.map((key) => {
        const Icon = ICONS[key] ?? Check;
        return (
          <div key={key} className="flex items-center gap-2 text-sm text-ink">
            <Icon className="h-4 w-4 shrink-0 text-gold" />
            {AMENITY_LABELS[key] ?? key}
          </div>
        );
      })}
    </div>
  );
}

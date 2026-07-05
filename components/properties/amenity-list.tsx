import {
  Bath,
  BedDouble,
  Tv,
  Thermometer,
  ShieldCheck,
  Wifi,
  UtensilsCrossed,
  Trees,
  Car,
  Sparkles,
  Check,
  type LucideIcon,
} from "lucide-react";

import { AMENITY_CATEGORIES } from "@/lib/amenities";

const CAT_ICONS: Record<string, LucideIcon> = {
  bad: Bath,
  soverom: BedDouble,
  underholdning: Tv,
  klima: Thermometer,
  sikkerhet: ShieldCheck,
  internett: Wifi,
  kjokken: UtensilsCrossed,
  utendors: Trees,
  parkering: Car,
  annet: Sparkles,
};

/** Fasiliteter gruppert etter kategori (Airbnb-lignende) på den offentlige siden. */
export function AmenityList({ amenities }: { amenities: string[] }) {
  const set = new Set(amenities);
  const groups = AMENITY_CATEGORIES.map((cat) => ({
    cat,
    items: cat.items.filter((i) => set.has(i.key)),
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {groups.map(({ cat, items }) => {
        const Icon = CAT_ICONS[cat.id] ?? Check;
        return (
          <div key={cat.id}>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-navy">
              <Icon className="h-4 w-4 text-gold" />
              {cat.label}
            </div>
            <ul className="flex flex-col gap-1 pl-6 text-sm text-ink">
              {items.map((i) => (
                <li key={i.key} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {i.label}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

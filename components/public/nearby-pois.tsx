import {
  ShoppingCart,
  UtensilsCrossed,
  PlugZap,
  Mountain,
  MapPin,
  type LucideIcon,
} from "lucide-react";

import type { Poi } from "@/lib/pois";

const CAT_ICONS: Record<string, LucideIcon> = {
  Dagligvare: ShoppingCart,
  Servering: UtensilsCrossed,
  Lading: PlugZap,
  Utsikt: Mountain,
};

const CAT_ORDER = ["Dagligvare", "Servering", "Utsikt", "Lading"];

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

/** Nærliggende steder gruppert etter kategori, med ikon og avstand. */
export function NearbyPois({
  pois,
  catLabels,
}: {
  pois: Poi[];
  catLabels?: Record<string, string>;
}) {
  if (pois.length === 0) return null;

  const groups = CAT_ORDER.map((cat) => ({
    cat,
    items: pois.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {groups.map(({ cat, items }) => {
        const Icon = CAT_ICONS[cat] ?? MapPin;
        return (
          <div key={cat}>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy">
              <Icon className="h-4 w-4 text-gold" />
              {catLabels?.[cat] ?? cat}
            </div>
            <ul className="flex flex-col gap-1.5 text-sm">
              {items.map((p, i) => (
                <li
                  key={`${p.name}-${i}`}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="truncate text-ink">{p.name}</span>
                  <span className="shrink-0 tabular-nums text-ink/50">
                    {formatDistance(p.distanceM)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

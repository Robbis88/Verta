import { createAdminClient } from "@/lib/supabase/admin";
import { haversineMeters } from "@/lib/geo";

export type Poi = { category: string; name: string; distanceM: number };

type OverpassEl = {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const OVERPASS = "https://overpass-api.de/api/interpreter";

/** Kategoriserer et OSM-element, eller null hvis det ikke er interessant. */
function categorize(tags: Record<string, string>): string | null {
  if (tags.shop === "supermarket") return "Dagligvare";
  if (tags.amenity === "restaurant" || tags.amenity === "cafe")
    return "Servering";
  if (tags.amenity === "charging_station") return "Lading";
  if (tags.tourism === "viewpoint") return "Utsikt";
  return null;
}

function fallbackName(category: string): string | null {
  if (category === "Lading") return "Ladestasjon";
  if (category === "Utsikt") return "Utsiktspunkt";
  return null; // dagligvare/servering uten navn hoppes over
}

/**
 * Henter nærliggende steder rundt en posisjon via OpenStreetMap/Overpass.
 * Gratis og uten API-nøkkel. Best-effort med timeout — feiler den, returnerer
 * vi en tom liste (siden viser da bare kartet).
 */
export async function fetchNearbyPois(
  lat: number,
  lng: number,
): Promise<Poi[]> {
  const query =
    `[out:json][timeout:20];(` +
    `node["shop"="supermarket"](around:7000,${lat},${lng});` +
    `node["amenity"~"restaurant|cafe"](around:6000,${lat},${lng});` +
    `node["amenity"="charging_station"](around:8000,${lat},${lng});` +
    `node["tourism"="viewpoint"](around:10000,${lat},${lng});` +
    `);out center 80;`;

  let json: { elements?: OverpassEl[] };
  try {
    const res = await fetch(OVERPASS, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    json = await res.json();
  } catch {
    return [];
  }

  const byCat = new Map<string, Poi[]>();
  for (const el of json.elements ?? []) {
    const tags = el.tags ?? {};
    const category = categorize(tags);
    if (!category) continue;
    const name = tags.name ?? fallbackName(category);
    if (!name) continue;

    const elat = el.lat ?? el.center?.lat;
    const elng = el.lon ?? el.center?.lon;
    if (elat == null || elng == null) continue;

    const distanceM = Math.round(
      haversineMeters({ lat, lng }, { lat: elat, lng: elng }),
    );
    const list = byCat.get(category) ?? [];
    list.push({ category, name, distanceM });
    byCat.set(category, list);
  }

  // Nærmeste 4 per kategori, sortert på avstand.
  const out: Poi[] = [];
  for (const list of byCat.values()) {
    list.sort((a, b) => a.distanceM - b.distanceM);
    out.push(...list.slice(0, 4));
  }
  return out;
}

/**
 * Henter (og cacher) nærliggende steder for en eiendom. Overpass kalles kun
 * én gang per eiendom; resultatet lagres i properties.nearby_pois.
 */
export async function getNearbyPois(p: {
  id: string;
  lat: number | null;
  lng: number | null;
  nearby_pois: Poi[] | null;
}): Promise<Poi[]> {
  if (Array.isArray(p.nearby_pois)) return p.nearby_pois;
  if (p.lat == null || p.lng == null) return [];

  const pois = await fetchNearbyPois(p.lat, p.lng);
  try {
    const admin = createAdminClient();
    await admin
      .from("properties")
      .update({ nearby_pois: pois })
      .eq("id", p.id);
  } catch (err) {
    console.error("getNearbyPois: lagring feilet", err);
  }
  return pois;
}

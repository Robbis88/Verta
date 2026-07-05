/**
 * Kanonisk liste over fasiliteter. Nøklene lagres i properties.amenities (text[]),
 * labels vises i eier-skjemaet og på den offentlige siden. Ikoner mappes i
 * visnings-komponenten (holder denne fila fri for React-avhengigheter).
 */
export const AMENITIES = [
  { key: "wifi", label: "WiFi" },
  { key: "parkering", label: "Parkering" },
  { key: "kjokken", label: "Kjøkken" },
  { key: "vaskemaskin", label: "Vaskemaskin" },
  { key: "torketrommel", label: "Tørketrommel" },
  { key: "oppvaskmaskin", label: "Oppvaskmaskin" },
  { key: "tv", label: "TV" },
  { key: "badstue", label: "Badstue" },
  { key: "boblebad", label: "Boblebad" },
  { key: "peis", label: "Peis" },
  { key: "terrasse", label: "Terrasse/balkong" },
  { key: "aircondition", label: "Aircondition" },
  { key: "kjaeledyr", label: "Kjæledyr tillatt" },
  { key: "barnevennlig", label: "Barnevennlig" },
] as const;

export type AmenityKey = (typeof AMENITIES)[number]["key"];

export const AMENITY_KEYS: Set<string> = new Set(AMENITIES.map((a) => a.key));

export const AMENITY_LABELS: Record<string, string> = Object.fromEntries(
  AMENITIES.map((a) => [a.key, a.label]),
);

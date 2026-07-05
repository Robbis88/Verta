/**
 * Kategorisert liste over fasiliteter (Airbnb-lignende). Nøklene lagres i
 * properties.amenities (text[]); kategorier + labels brukes i eier-skjemaet og
 * på den offentlige siden. Ikoner mappes i visnings-komponenten (holder denne
 * fila fri for React-avhengigheter). Gamle nøkler beholdt for bakoverkompat.
 */
export type Amenity = { key: string; label: string };
export type AmenityCategory = { id: string; label: string; items: Amenity[] };

export const AMENITY_CATEGORIES: AmenityCategory[] = [
  {
    id: "bad",
    label: "Bad",
    items: [
      { key: "harfoner", label: "Hårføner" },
      { key: "sjampo", label: "Sjampo" },
      { key: "balsam", label: "Balsam" },
      { key: "kroppssape", label: "Dusjsåpe / kroppssåpe" },
      { key: "handklaer", label: "Håndklær" },
      { key: "varmtvann", label: "Varmtvann" },
    ],
  },
  {
    id: "soverom",
    label: "Soverom og vask",
    items: [
      { key: "sengetoy", label: "Sengetøy" },
      { key: "vaskemaskin", label: "Vaskemaskin" },
      { key: "torketrommel", label: "Tørketrommel" },
      { key: "kleshengere", label: "Kleshengere" },
      { key: "strykejern", label: "Strykejern" },
    ],
  },
  {
    id: "underholdning",
    label: "Underholdning",
    items: [
      { key: "tv", label: "TV" },
      { key: "treningsutstyr", label: "Treningsutstyr" },
      { key: "spill", label: "Spill / bordtennis" },
    ],
  },
  {
    id: "klima",
    label: "Oppvarming og kjøling",
    items: [
      { key: "oppvarming", label: "Oppvarming" },
      { key: "aircondition", label: "Aircondition" },
      { key: "vifte", label: "Vifte" },
      { key: "peis", label: "Peis" },
    ],
  },
  {
    id: "sikkerhet",
    label: "Sikkerhet i hjemmet",
    items: [
      { key: "roykvarsler", label: "Røykvarsler" },
      { key: "co_varsler", label: "CO-varsler" },
      { key: "brannslukker", label: "Brannslukker" },
      { key: "forstehjelp", label: "Førstehjelpsskrin" },
    ],
  },
  {
    id: "internett",
    label: "Internett og kontor",
    items: [
      { key: "wifi", label: "WiFi" },
      { key: "arbeidsplass", label: "Arbeidsplass" },
    ],
  },
  {
    id: "kjokken",
    label: "Kjøkken og servering",
    items: [
      { key: "kjokken", label: "Kjøkken" },
      { key: "kjoleskap", label: "Kjøleskap" },
      { key: "oppvaskmaskin", label: "Oppvaskmaskin" },
      { key: "komfyr", label: "Komfyr" },
      { key: "ovn", label: "Stekeovn" },
      { key: "mikrobolgeovn", label: "Mikrobølgeovn" },
      { key: "kaffetrakter", label: "Kaffetrakter" },
      { key: "vannkoker", label: "Vannkoker" },
      { key: "brodrister", label: "Brødrister" },
      { key: "kokekar", label: "Kokekar og redskaper" },
      { key: "servise", label: "Servise og bestikk" },
      { key: "spisebord", label: "Spisebord" },
    ],
  },
  {
    id: "utendors",
    label: "Utendørs",
    items: [
      { key: "hage", label: "Hage / uteområde" },
      { key: "terrasse", label: "Terrasse / balkong" },
      { key: "utemobler", label: "Utemøbler" },
      { key: "utespiseplass", label: "Utendørs spiseplass" },
      { key: "grill", label: "Grill" },
      { key: "solseng", label: "Solsenger" },
      { key: "badstue", label: "Badstue" },
      { key: "boblebad", label: "Boblebad" },
    ],
  },
  {
    id: "parkering",
    label: "Parkering og fasiliteter",
    items: [
      { key: "parkering", label: "Parkering" },
      { key: "gratis_parkering", label: "Gratis parkering" },
      { key: "lademulighet", label: "Lademulighet (elbil)" },
      { key: "resirkulering", label: "Resirkulering" },
    ],
  },
  {
    id: "annet",
    label: "Annet",
    items: [
      { key: "kjaeledyr", label: "Kjæledyr tillatt" },
      { key: "barnevennlig", label: "Barnevennlig" },
      { key: "royking", label: "Røyking tillatt" },
    ],
  },
];

export const AMENITIES: Amenity[] = AMENITY_CATEGORIES.flatMap((c) => c.items);

export const AMENITY_KEYS: Set<string> = new Set(AMENITIES.map((a) => a.key));

export const AMENITY_LABELS: Record<string, string> = Object.fromEntries(
  AMENITIES.map((a) => [a.key, a.label]),
);

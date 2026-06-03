/**
 * Sentraliserte bilde-URL-er (Unsplash). Norske hytte-/fjord-/sjø-motiver.
 * Bytt gjerne ut med egne bilder senere.
 */
const U = "https://images.unsplash.com";

export const IMG = {
  // Hamnøy, Lofoten — røde rorbuer, snøkledd fjell, fjord
  hero: `${U}/photo-1710762635726-531b4a22d4ca?w=1600&q=80&auto=format&fit=crop`,
  // Røde rorbuer på påler over vannet
  rorbuer: `${U}/photo-1652086509880-22387045325c?w=1400&q=80&auto=format&fit=crop`,
  // Rød hytte ved sjøen på svaberg
  seaCabin: `${U}/photo-1564086315895-f3f695934f3a?w=1000&q=80&auto=format&fit=crop`,
} as const;

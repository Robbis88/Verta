/**
 * Geokoder en norsk adresse til koordinater via Kartverket (Geonorge).
 * Gratis, ingen nøkkel. Returnerer null om adressen ikke finnes.
 */
export async function geocodeNorway(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = address.trim();
  if (!q) return null;
  try {
    const url = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(
      q,
    )}&treffPerSide=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      adresser?: { representasjonspunkt?: { lat: number; lon: number } }[];
    };
    const pt = data.adresser?.[0]?.representasjonspunkt;
    if (!pt || typeof pt.lat !== "number" || typeof pt.lon !== "number") {
      return null;
    }
    return { lat: pt.lat, lng: pt.lon };
  } catch {
    return null;
  }
}

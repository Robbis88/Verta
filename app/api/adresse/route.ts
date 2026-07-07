import { NextResponse } from "next/server";

/**
 * Adresse-autofullføring via Kartverket (Geonorge). Proxy for å unngå CORS og
 * gi klienten et enkelt format. Offentlig oppslag — ingen sensitive data.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 3) return NextResponse.json({ suggestions: [] });

  try {
    const url =
      `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(q)}` +
      `&treffPerSide=6&fuzzy=true`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] });

    const data = (await res.json()) as {
      adresser?: {
        adressetekst?: string;
        postnummer?: string;
        poststed?: string;
        representasjonspunkt?: { lat: number; lon: number };
      }[];
    };

    const titleCase = (s: string) =>
      s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

    const suggestions = (data.adresser ?? [])
      .map((a) => ({
        text: `${a.adressetekst}, ${a.postnummer} ${titleCase(a.poststed ?? "")}`,
        lat: a.representasjonspunkt?.lat,
        lng: a.representasjonspunkt?.lon,
      }))
      .filter((s) => typeof s.lat === "number" && typeof s.lng === "number");

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}

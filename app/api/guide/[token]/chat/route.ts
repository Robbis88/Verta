import type Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

import { anthropic, CHAT_MODEL } from "@/lib/anthropic";
import { createAdminClient } from "@/lib/supabase/admin";
import { AMENITY_LABELS } from "@/lib/amenities";

// Tak per guide-token: nok for en ekte gjest, stopper spam. Beskytter mot at
// én gjest kjører opp Anthropic-kostnaden på den åpne (innloggingsfrie) chatten.
const MAX_PER_MINUTE = 8;
const MAX_PER_DAY = 120;
const MAX_INPUT_CHARS = 2000;

/**
 * AI-concierge for en delbar gjesteguide. Svarer gjesten KUN fra boligens fakta,
 * på gjestens eget språk. Vet den ikke svaret, ber den gjesten kontakte verten.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { messages } = (await request.json()) as {
    messages: Anthropic.MessageParam[];
  };
  if (!Array.isArray(messages)) {
    return Response.json({ error: "messages må være en liste" }, { status: 400 });
  }

  // Avvis urimelig lange meldinger (billig DoS-vern + kostnadstak).
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastText =
    typeof lastUser?.content === "string" ? lastUser.content : "";
  if (lastText.length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: "Meldingen er for lang. Del den gjerne opp." },
      { status: 413 },
    );
  }

  const supabase = createAdminClient();

  // Rate limiting per guide-token (minutt + døgn). Lagrer kun tellere, ikke
  // innhold. Går telleren over taket → 429 med vennlig beskjed.
  const now = new Date();
  const minuteBucket = now.toISOString().slice(0, 16);
  const dayBucket = now.toISOString().slice(0, 10);
  const [minRes, dayRes] = await Promise.all([
    supabase.rpc("bump_guide_limit", { p_token: token, p_bucket: minuteBucket }),
    supabase.rpc("bump_guide_limit", { p_token: token, p_bucket: dayBucket }),
  ]);
  const minuteCount = (minRes.data as number | null) ?? 0;
  const dayCount = (dayRes.data as number | null) ?? 0;
  if (minuteCount > MAX_PER_MINUTE || dayCount > MAX_PER_DAY) {
    return Response.json(
      {
        error:
          "For mange meldinger akkurat nå. Vent litt og prøv igjen, eller trykk «Kontakt verten» under.",
      },
      { status: 429 },
    );
  }
  const { data: p } = await supabase
    .from("properties")
    .select(
      "id,name,address,wifi_name,wifi_password,access_info,appliances_info,house_rules,checkout_info,amenities,travel_guide",
    )
    .eq("guide_token", token)
    .maybeSingle();
  if (!p) {
    return Response.json({ error: "Ukjent guide" }, { status: 404 });
  }

  const amenities = ((p.amenities as string[] | null) ?? [])
    .map((k) => AMENITY_LABELS[k])
    .filter(Boolean)
    .join(", ");

  // Registrert utstyr (TV, AC, kaffemaskin …) med merke/modell. AI-en kjenner
  // vanlige modeller og kan forklare bruken, kombinert med eierens notater.
  const { data: eq } = await supabase
    .from("house_equipment")
    .select("name,category,location,brand,model,notes")
    .eq("property_id", p.id)
    .order("created_at");
  const equipmentLines = (eq ?? [])
    .map((e) => {
      const model = [e.brand, e.model].filter(Boolean).join(" ");
      const parts = [
        `- ${e.name}`,
        e.location ? `(${e.location})` : "",
        model ? `— ${model}` : "",
        e.category ? `[${e.category}]` : "",
        e.notes ? `Notat: ${e.notes}` : "",
      ].filter(Boolean);
      return parts.join(" ");
    })
    .join("\n");

  const system = `Du er den digitale vertskaps-assistenten for utleieboligen "${p.name}"${
    p.address ? ` (${p.address})` : ""
  }. Du hjelper gjesten under oppholdet.

VIKTIGE REGLER:
- Svar ALLTID på SAMME SPRÅK som gjesten skriver på (engelsk → engelsk, norsk → norsk, tysk → tysk, osv.).
- Vær kort, vennlig og konkret.
- Bruk KUN fakta under om selve boligen (WiFi, tilkomst, regler osv.). IKKE finn på slike detaljer.
- UNNTAK for utstyr: For apparatene i «UTSTYR I BOLIGEN» kan du bruke din generelle kunnskap om nettopp det merket/modellen til å forklare praktisk bruk (f.eks. hvordan bytte kilde på en Samsung-TV, starte en vaskemaskin, stille en varmepumpe). Kombiner med eierens notater. Er du usikker på modellen, gi et trygt generelt svar og be dem eventuelt kontakte verten.
- Finner du ikke svaret, eller virker noe ikke i praksis, be gjesten vennlig trykke «Kontakt verten» så tar utleieren over.

FAKTA OM BOLIGEN:
- WiFi: ${p.wifi_name ?? "ukjent"}${p.wifi_password ? ` / passord: ${p.wifi_password}` : ""}
- Tilkomst: ${p.access_info ?? "ingen oppgitt"}
- Slik funker det (apparater m.m.): ${p.appliances_info ?? "ingen oppgitt"}
- Husregler: ${p.house_rules ?? "ingen oppgitt"}
- Utsjekk: ${p.checkout_info ?? "ingen oppgitt"}
- Fasiliteter: ${amenities || "ingen oppgitt"}
- Lokale anbefalinger: ${p.travel_guide ?? "ingen oppgitt"}

UTSTYR I BOLIGEN (merke/modell + eierens notater):
${equipmentLines || "- ingen registrert"}`;

  const stream = anthropic.messages.stream({
    model: CHAT_MODEL,
    max_tokens: 1024,
    system: [
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
    ],
    messages: messages.slice(-12),
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

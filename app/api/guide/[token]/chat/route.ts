import type { NextRequest } from "next/server";

import { anthropic, CHAT_MODEL } from "@/lib/anthropic";
import { createAdminClient } from "@/lib/supabase/admin";
import { AMENITY_LABELS } from "@/lib/amenities";
import { sanitizeChat } from "@/lib/chat-guard";

// Tak per guide-token: nok for en ekte gjest, stopper spam. Beskytter mot at
// én gjest kjører opp Anthropic-kostnaden på den åpne (innloggingsfrie) chatten.
const MAX_PER_MINUTE = 8;
const MAX_PER_DAY = 120;

/**
 * AI-concierge for en delbar gjesteguide. Svarer gjesten KUN fra boligens fakta,
 * på gjestens eget språk. Vet den ikke svaret, ber den gjesten kontakte verten.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const payload = (await request.json()) as { messages: unknown };

  // Input-vern: kap antall meldinger + samlet tekstlengde over ALLE meldinger
  // som faktisk sendes (ikke bare siste), avvis ikke-tekst. Dette lukker
  // omgåelsen der en stor tidligere melding slapp forbi lengdesjekken.
  const guard = sanitizeChat(payload.messages);
  if (!guard.ok) {
    return Response.json({ error: guard.error }, { status: guard.status });
  }
  const messages = guard.messages;

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

  // Tjenester: faste (med tidsplan AI-en kan svare fra) og på bestilling.
  const { data: svc } = await supabase
    .from("property_services")
    .select("name,kind,schedule_days,note")
    .eq("property_id", p.id)
    .eq("active", true)
    .order("created_at");
  const serviceLines = (svc ?? [])
    .map((s) => {
      if (s.kind === "scheduled") {
        return `- ${s.name} — fast tidsplan: ${s.schedule_days ?? "ukjent"}.${s.note ? ` ${s.note}` : ""}`;
      }
      return `- ${s.name} — på bestilling (gjesten trykker «Be om» under Tjenester).${s.note ? ` ${s.note}` : ""}`;
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
- TJENESTER: Spør gjesten om noe som gjelder en tjeneste under «TJENESTER» (f.eks. «poolen er skitten», «badstampen er kald», «trenger vask»), svar hjelpsomt: har tjenesten fast tidsplan, fortell når den kommer neste gang ut fra dagene som er oppgitt. Er den «på bestilling», be gjesten trykke «Be om» under Tjenester i guiden, så ordner verten det. Ikke lov en konkret dato for på-bestilling-tjenester.
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
${equipmentLines || "- ingen registrert"}

TJENESTER (fast tidsplan eller på bestilling):
${serviceLines || "- ingen registrert"}`;

  const stream = anthropic.messages.stream({
    model: CHAT_MODEL,
    max_tokens: 1024,
    system: [
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
    ],
    messages,
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

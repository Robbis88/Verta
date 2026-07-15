import type Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

import { anthropic, DEFAULT_MODEL } from "@/lib/anthropic";
import { createAdminClient } from "@/lib/supabase/admin";
import { AMENITY_LABELS } from "@/lib/amenities";

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

  const supabase = createAdminClient();
  const { data: p } = await supabase
    .from("properties")
    .select(
      "name,address,wifi_name,wifi_password,access_info,appliances_info,house_rules,checkout_info,amenities,travel_guide",
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

  const system = `Du er den digitale vertskaps-assistenten for utleieboligen "${p.name}"${
    p.address ? ` (${p.address})` : ""
  }. Du hjelper gjesten under oppholdet.

VIKTIGE REGLER:
- Svar ALLTID på SAMME SPRÅK som gjesten skriver på (engelsk → engelsk, norsk → norsk, tysk → tysk, osv.).
- Vær kort, vennlig og konkret.
- Bruk KUN fakta under. Finner du ikke svaret, eller virker noe ikke (f.eks. varmepumpe), be gjesten vennlig trykke «Kontakt verten» så tar utleieren over. IKKE finn på svar.

FAKTA OM BOLIGEN:
- WiFi: ${p.wifi_name ?? "ukjent"}${p.wifi_password ? ` / passord: ${p.wifi_password}` : ""}
- Tilkomst: ${p.access_info ?? "ingen oppgitt"}
- Slik funker det (apparater m.m.): ${p.appliances_info ?? "ingen oppgitt"}
- Husregler: ${p.house_rules ?? "ingen oppgitt"}
- Utsjekk: ${p.checkout_info ?? "ingen oppgitt"}
- Fasiliteter: ${amenities || "ingen oppgitt"}
- Lokale anbefalinger: ${p.travel_guide ?? "ingen oppgitt"}`;

  const stream = anthropic.messages.stream({
    model: DEFAULT_MODEL,
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

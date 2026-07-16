import type Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { anthropic, CHAT_MODEL } from "@/lib/anthropic";

const LANDING_SYSTEM = `Du er «Vera», Verta sin vennlige assistent. Verta er en norsk SaaS for utleieforvaltning av hytter, leiligheter og Airbnb-utleie.

Hjelp besøkende: forklar funksjoner og priser, og oppmuntre til å registrere seg (lenke: /registrer). Svar kort og imøtekommende, på brukerens språk (standard norsk). Ikke lov noe Verta ikke har.

Pris: 399 kr/mnd (eller 3 990 kr/år), alt inkludert, 1 eiendom. Ekstra eiendom 199 kr/mnd (eller 1 990 kr/år). Gjestene betaler INGEN plattformgebyr — de betaler utleieren direkte.

Funksjoner: kalender med toveis iCal-synk (Airbnb/Booking), direkte bookinger uten gebyr, smartlås (Nuki/Igloohome/Salto) eller nøkkelboks med automatisk adgangskode, digital gjesteguide, AI-forslag på svar til gjestemeldinger og anmeldelser, varsler om tomme datoer med ferdig kampanje, utgiftssporing og norsk skatterapport, rengjøring med egen vasker-portal, vedlikehold, lager/handleliste, AI-prisforslag, co-host/team, tofaktor, boost-markedsføring på Vertas sosiale kanaler, og installerbar mobil-app (PWA).`;

const PORTAL_SYSTEM = `Du er «Vera», Verta sin assistent for innloggede brukere. Hjelp med «hvordan gjør jeg X» i appen. Svar kort og konkret på brukerens språk. Ikke finn på funksjoner som ikke finnes.

Hvor ting ligger i dashbordet:
- Eiendommer: legg til/rediger eiendom (WiFi, husregler, tilkomst), smartlås, iCal-import og kalender.
- Drift: Meldinger (AI-svar til gjester), Varsler (tomme datoer), Rengjøring (vaskere + oppgaver), Vedlikehold, Lager.
- Marked: Prising (AI-prisforslag), Boost (markedsføring).
- Økonomi: Utgifter, Provisjon, Skatt.
- Konto: Team (inviter co-host), Sikkerhet (passord + 2FA), Innstillinger.`;

/**
 * Chat-route mot Claude for assistenten «Vera». Tar { messages, context }
 * og strømmer svaret som ren tekst. System-prompten caches (ephemeral).
 */
export async function POST(request: NextRequest) {
  const { messages, context } = (await request.json()) as {
    messages: Anthropic.MessageParam[];
    context?: "landing" | "portal";
  };

  if (!Array.isArray(messages)) {
    return Response.json({ error: "messages må være en liste" }, { status: 400 });
  }

  const system = context === "portal" ? PORTAL_SYSTEM : LANDING_SYSTEM;
  const trimmed = messages.slice(-12);

  const stream = anthropic.messages.stream({
    model: CHAT_MODEL,
    max_tokens: 1024,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: trimmed,
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

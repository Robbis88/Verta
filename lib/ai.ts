import { anthropic, DEFAULT_MODEL } from "@/lib/anthropic";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  both: "Instagram og Facebook",
};

/**
 * Genererer norsk annonsetekst for en boost-kampanje via Claude.
 * Returnerer tom streng hvis modellen ikke gir tekst.
 */
export async function generateBoostCopy(input: {
  name: string;
  description?: string | null;
  address?: string | null;
  maxGuests?: number | null;
  platform: string;
}): Promise<string> {
  const platform = PLATFORM_LABEL[input.platform] ?? "sosiale medier";

  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content:
          `Du er markedsfører for norske utleiehytter. Skriv én kort, fengende ` +
          `annonsetekst på norsk for ${platform} for utleieobjektet under. ` +
          `Maks 70 ord, vennlig og innbydende tone, 1–2 passende emojis, en ` +
          `tydelig oppfordring til å booke direkte, og avslutt med 3 relevante ` +
          `hashtags. Svar med kun annonseteksten.\n\n` +
          `Navn: ${input.name}\n` +
          `Sted: ${input.address ?? "Norge"}\n` +
          `Beskrivelse: ${input.description ?? "Koselig feriebolig"}\n` +
          `Maks gjester: ${input.maxGuests ?? "ukjent"}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

/**
 * Foreslår et svar på en gjestemelding, på samme språk som gjesten skrev.
 * Bruker kun fakta om eiendommen — finner ikke på noe.
 */
export async function suggestGuestReply(input: {
  property: {
    name: string;
    address?: string | null;
    wifiName?: string | null;
    houseRules?: string | null;
    checkoutInfo?: string | null;
    accessInfo?: string | null;
  };
  guestMessage: string;
}): Promise<string> {
  const p = input.property;
  const facts =
    `- Sted: ${p.address ?? "ukjent"}\n` +
    `- WiFi: ${p.wifiName ?? "ukjent"}\n` +
    `- Husregler: ${p.houseRules ?? "ingen oppgitt"}\n` +
    `- Utsjekk: ${p.checkoutInfo ?? "ingen oppgitt"}\n` +
    `- Tilkomst: ${p.accessInfo ?? "ingen oppgitt"}`;

  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content:
          `Du er vert for utleieboligen "${p.name}". En gjest har sendt ` +
          `meldingen nederst. Skriv et vennlig, kort og presist svar PÅ SAMME ` +
          `SPRÅK som gjesten skrev på. Bruk kun fakta under — ikke finn på ` +
          `noe. Mangler du info, si høflig at verten følger opp. Svar med ` +
          `kun svarteksten, uten anførselstegn.\n\nFakta:\n${facts}\n\n` +
          `Gjestens melding:\n${input.guestMessage}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

/**
 * Foreslår et svar på en anmeldelse: takker, inviterer tilbake ved høy score,
 * adresserer kritikk saklig ved lav. Samme språk som anmeldelsen.
 */
export async function suggestReviewReply(input: {
  propertyName?: string | null;
  rating: number;
  review: string;
}): Promise<string> {
  const tone =
    input.rating >= 5
      ? "Takk varmt og inviter gjesten tilbake."
      : input.rating >= 4
        ? "Takk for tilbakemeldingen og nevn kort at dere alltid forbedrer dere."
        : "Beklag saklig, takk for ærligheten, og vis at dere tar det på alvor uten å bli defensiv.";

  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content:
          `Du er vert${input.propertyName ? ` for "${input.propertyName}"` : ""}. ` +
          `Skriv et profesjonelt, varmt svar på anmeldelsen under (${input.rating} av 5 stjerner). ` +
          `${tone} Hold det kort (maks 60 ord), på SAMME SPRÅK som anmeldelsen. ` +
          `Svar med kun svarteksten.\n\nAnmeldelse:\n${input.review}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

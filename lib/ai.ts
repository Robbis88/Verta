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

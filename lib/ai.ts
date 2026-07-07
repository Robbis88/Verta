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
 * Genererer en innbydende, Airbnb-lignende annonsetekst for den offentlige
 * boligvisningen. Bruker kun oppgitte fakta — finner ikke på fasiliteter.
 */
export async function generatePropertyListing(input: {
  name: string;
  address?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  beds?: number | null;
  maxGuests?: number | null;
  amenities?: string[]; // ferdig oversatte labels
  description?: string | null;
  tone?: string;
}): Promise<string> {
  const facts =
    `Navn: ${input.name}\n` +
    `Sted: ${input.address ?? "Norge"}\n` +
    `Soverom: ${input.bedrooms ?? "ukjent"} · Senger: ${input.beds ?? "ukjent"} · ` +
    `Bad: ${input.bathrooms ?? "ukjent"} · Maks gjester: ${input.maxGuests ?? "ukjent"}\n` +
    `Fasiliteter: ${input.amenities?.length ? input.amenities.join(", ") : "ingen oppgitt"}\n` +
    `Eierens notat: ${input.description ?? "ingen"}`;

  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content:
          `Du skriver annonsetekst for norske utleieboliger på nivå med de beste ` +
          `Airbnb-annonsene. Skriv en innbydende, konkret og varm beskrivelse på ` +
          `norsk av boligen under, i ${input.tone ?? "vennlig og inspirerende"} tone. ` +
          `Selg OPPLEVELSEN av å bo der, ikke bare fakta. 2–4 korte avsnitt. ` +
          `Bruk KUN fakta som er oppgitt — ikke finn på fasiliteter, avstander ` +
          `eller stedsnavn. Ingen overskrift, ingen emojis, ingen hashtags. ` +
          `Svar med kun brødteksten.\n\n${facts}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

/**
 * Genererer en kort, ærlig beskrivelse av området rundt en eiendom.
 * Har ikke live kartdata, så den holder seg til generelle, trygge trekk ved
 * regionen og finner ikke på spesifikke virksomheter, avstander eller navn.
 */
export async function generateAreaDescription(input: {
  name: string;
  address?: string | null;
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content:
          `Skriv en kort, innbydende beskrivelse på norsk (2–3 setninger) av ` +
          `området og typiske aktiviteter i regionen rundt en utleiebolig som ` +
          `ligger her: ${input.address ?? "Norge"}. Vær stemningsfull, men ` +
          `ÆRLIG: ikke finn på spesifikke virksomheter, stedsnavn, avstander ` +
          `eller fasiliteter du ikke kan være sikker på. Beskriv heller ` +
          `landskapet og hva slags opplevelser området egner seg for. ` +
          `Svar med kun teksten.`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

/**
 * Genererer en kort AI-reiseguide for gjester som har booket et opphold.
 * Gir forslag etter tema (servering, aktiviteter, turer, bad, barn, regnvær).
 * Holder seg til generell, regional kunnskap og oppfordrer til å dobbeltsjekke.
 */
export async function generateTravelGuide(input: {
  name: string;
  address?: string | null;
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content:
          `Du er en lokalkjent vert. En gjest har booket oppholdet "${input.name}"` +
          `${input.address ? ` i ${input.address}` : ""}. Skriv en kort, ` +
          `hjelpsom reiseguide på norsk med forslag til hva de kan gjøre under ` +
          `oppholdet. Bruk generell, regional kunnskap; er du usikker på ` +
          `eksakte navn eller åpningstider, beskriv heller TYPEN sted og hvor ` +
          `man finner det — ikke finn på detaljer. Svar med disse seksjonene, ` +
          `hver med overskrift og 1–3 korte punkter:\n\n` +
          `SPISE OG DRIKKE\nAKTIVITETER\nTURER\nBADESTEDER\nFOR BARN\nREGNVÆRSDAGER\nLOKALE TIPS`,
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
 * Foreslår nattepriser per sesong for en norsk utleiebolig, basert på
 * beliggenhet, størrelse og kommende belegg. Rådgivende (lagres ikke).
 */
export async function suggestPricing(input: {
  propertyName: string;
  address?: string | null;
  bedrooms?: number | null;
  maxGuests?: number | null;
  occupancyPct: number;
  currentPrice?: number | null;
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content:
          `Du er inntektsrådgiver for norsk korttidsutleie. Foreslå nattepriser ` +
          `i NOK for boligen under. Ta hensyn til norsk sesongmønster (sommer og ` +
          `vinterferie/påske er høysesong for hytter), størrelse og kommende ` +
          `belegg. ${input.currentPrice ? `Nåværende pris er ca. ${input.currentPrice} kr/natt. ` : ""}` +
          `Svar med disse seksjonene:\n\n` +
          `ANBEFALT NÅ: <pris + kort begrunnelse ut fra belegget>\n\n` +
          `SESONGPRISER:\n- Lavsesong: <kr/natt>\n- Mellomsesong: <kr/natt>\n- Høysesong: <kr/natt>\n\n` +
          `TIPS: <1–2 konkrete råd for å øke inntekten>\n\n` +
          `Bolig: ${input.propertyName}\n` +
          `Sted: ${input.address ?? "Norge"}\n` +
          `Soverom: ${input.bedrooms ?? "ukjent"} · Maks gjester: ${input.maxGuests ?? "ukjent"}\n` +
          `Belegg neste 90 dager: ${input.occupancyPct} %`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

/**
 * Lager ferdig kampanjemateriale for et tomt-dato-varsel: e-post, Instagram,
 * Facebook og en foreslått rabatt — for å fylle ledige datoer.
 */
export async function generateAlertCampaign(input: {
  propertyName: string;
  address?: string | null;
  gapStart?: string | null;
  gapEnd?: string | null;
  occupancyPct?: number | null;
}): Promise<string> {
  const period =
    input.gapStart && input.gapEnd
      ? `for ledige datoer ${input.gapStart} – ${input.gapEnd}`
      : input.occupancyPct != null
        ? `for å løfte belegget (nå ${input.occupancyPct}% de neste 60 dagene)`
        : "for å fylle ledige datoer";

  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content:
          `Du er markedsfører for den norske utleieboligen "${input.propertyName}"` +
          `${input.address ? ` (${input.address})` : ""}. Lag ferdig kampanjemateriale ` +
          `på norsk ${period}. Foreslå en rabatt mellom 15 og 25 %. ` +
          `Svar med nøyaktig disse fire seksjonene, hver med overskrift:\n\n` +
          `RABATT: <foreslått rabatt + kort begrunnelse>\n\n` +
          `E-POST (emne + tekst):\n<emne>\n<kort tekst>\n\n` +
          `INSTAGRAM:\n<caption med 1–2 emojis og 3 hashtags>\n\n` +
          `FACEBOOK:\n<litt lengre innlegg med oppfordring til å booke direkte>`,
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

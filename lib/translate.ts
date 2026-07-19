import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { anthropic, CHAT_MODEL } from "@/lib/anthropic";
import type { GuestLang } from "@/lib/guest-i18n";

/**
 * AI-oversettelse av eierens fritekst på gjestesiden. Eieren skriver på norsk;
 * gjesten leser på sitt språk. Vi cacher per (bolig, felt, språk) i
 * property_translations, og oversetter kun på nytt når kilde-teksten endres.
 * Feiler oversettelsen, faller vi tilbake til originalteksten (bedre enn blank).
 */

const LANG_NAME: Record<Exclude<GuestLang, "nb">, string> = {
  en: "English",
  de: "German (Deutsch)",
};

/** Rask, stabil hash (djb2) — kun for å oppdage om kilde-teksten er endret. */
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function translateOne(text: string, langName: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content:
          `Translate the following text to ${langName}. Keep the meaning ` +
          `faithful, preserve line breaks and formatting, and do not add or ` +
          `remove information. Output ONLY the translation, with no preamble ` +
          `or quotes.\n\n---\n${text}`,
      },
    ],
  });
  const block = msg.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : text;
}

/**
 * Oversetter et sett felt (norsk → mållang). Returnerer en map med samme nøkler.
 * For norsk (eller ukjent språk) returneres feltene uendret.
 */
export async function translateOwnerContent(
  propertyId: string,
  lang: GuestLang,
  fields: Record<string, string | null>,
): Promise<Record<string, string | null>> {
  if (lang === "nb") return fields;
  const langName = LANG_NAME[lang];
  if (!langName) return fields;

  const supabase = createAdminClient();
  const { data: cached } = await supabase
    .from("property_translations")
    .select("field,source_hash,translated")
    .eq("property_id", propertyId)
    .eq("lang", lang);
  const cacheMap = new Map(
    (cached ?? []).map((r) => [
      r.field as string,
      r as { source_hash: string; translated: string },
    ]),
  );

  const out: Record<string, string | null> = {};
  const missing: { field: string; text: string; h: string }[] = [];

  for (const [field, text] of Object.entries(fields)) {
    if (!text) {
      out[field] = text;
      continue;
    }
    const h = hash(text);
    const c = cacheMap.get(field);
    if (c && c.source_hash === h) {
      out[field] = c.translated;
    } else {
      out[field] = text; // trygg fallback inntil oversettelsen er klar
      missing.push({ field, text, h });
    }
  }

  if (missing.length > 0) {
    const translated = await Promise.all(
      missing.map(async (m) => {
        try {
          return { ...m, translated: await translateOne(m.text, langName) };
        } catch {
          return { ...m, translated: m.text }; // fallback til original
        }
      }),
    );
    for (const t of translated) out[t.field] = t.translated;

    // Skriv til cache (upsert på sammensatt nøkkel). Kjør «fire and forget»-
    // trygt: feil her skal ikke velte siden.
    const rows = translated
      .filter((t) => t.translated !== t.text) // ikke cache rene fallbacks
      .map((t) => ({
        property_id: propertyId,
        field: t.field,
        lang,
        source_hash: t.h,
        translated: t.translated,
      }));
    if (rows.length > 0) {
      await supabase
        .from("property_translations")
        .upsert(rows, { onConflict: "property_id,field,lang" });
    }
  }

  return out;
}

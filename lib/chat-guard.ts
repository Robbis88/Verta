/**
 * Felles validering av chat-input før det sendes til Anthropic. Beskytter mot
 * kostnadsmisbruk: kapper antall meldinger, samlet tekstlengde over ALLE
 * meldinger som faktisk sendes, og avviser ikke-tekst-innhold (bilder o.l.).
 */
export const MAX_MESSAGES = 12;
export const MAX_TOTAL_CHARS = 8000; // ~2000 input-tokens

type Msg = { role: "user" | "assistant"; content: string };

export type ChatGuardResult =
  | { ok: true; messages: Msg[] }
  | { ok: false; error: string; status: number };

export function sanitizeChat(raw: unknown): ChatGuardResult {
  if (!Array.isArray(raw)) {
    return { ok: false, error: "messages må være en liste", status: 400 };
  }
  // Kun de siste MAX_MESSAGES teller — det er dette som faktisk sendes videre.
  const sliced = raw.slice(-MAX_MESSAGES);
  const clean: Msg[] = [];
  let total = 0;
  for (const m of sliced) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (typeof content !== "string") {
      return { ok: false, error: "Kun tekstmeldinger støttes.", status: 413 };
    }
    if (role !== "user" && role !== "assistant") continue;
    total += content.length;
    clean.push({ role, content });
  }
  if (total > MAX_TOTAL_CHARS) {
    return {
      ok: false,
      error: "For mye tekst. Del meldingen opp.",
      status: 413,
    };
  }
  return { ok: true, messages: clean };
}

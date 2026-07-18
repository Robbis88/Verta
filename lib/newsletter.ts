import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Melder en e-post på nyhetsbrevet med aktivt samtykke. Upsert på e-post, så en
 * ny påmelding fornyer samtykke og opphever en evt. tidligere avmelding.
 * Krever gyldig e-post; svelger feil (skal aldri velte flyten som kalte den).
 */
export async function subscribeNewsletter(opts: {
  email: string;
  name?: string | null;
  source: string;
}): Promise<boolean> {
  const email = opts.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  try {
    const supabase = createAdminClient();
    // MERK: setter IKKE unsubscribed_at her. En anonym påmelding skal aldri
    // kunne gjenaktivere en e-post som har meldt seg av (GDPR/opt-out).
    // Eksisterende avmelding beholdes; kun consent/navn/kilde oppdateres.
    await supabase.from("newsletter_subscribers").upsert(
      {
        email,
        name: opts.name?.trim() || null,
        source: opts.source,
        consent_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );
    return true;
  } catch {
    return false;
  }
}

/** Avmelder en e-post via avmeldings-token. Returnerer om noe ble avmeldt. */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .is("unsubscribed_at", null)
      .select("id");
    return !!data && data.length > 0;
  } catch {
    return false;
  }
}

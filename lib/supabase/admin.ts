import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase-klient. KUN SERVER — omgår RLS.
 * Brukes til webhooks og systemoperasjoner (f.eks. audit-logging,
 * oppdatering av plan fra Stripe). Må ALDRI importeres i client-kode.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

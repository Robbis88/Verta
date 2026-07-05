import { NextResponse } from "next/server";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

/**
 * Retur-URL fra Stripe Connect-onboarding. Henter kontostatusen med én gang og
 * setter payouts_enabled, så eieren ser riktig status uten å vente på
 * account.updated-webhooken. Webhooken gjør det samme (idempotent) som backup.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  await requireUser();
  const profile = await getCurrentProfile();
  const connectId = profile?.stripe_connect_id;

  if (!stripe || !connectId) {
    return NextResponse.redirect(`${origin}/dashboard/settings`);
  }

  const account = await stripe.accounts.retrieve(connectId);
  const ready = account.payouts_enabled === true;

  const supabase = await createClient();
  await supabase
    .from("users")
    .update({ payouts_enabled: ready })
    .eq("id", profile.id);

  return NextResponse.redirect(
    `${origin}/dashboard/settings?utbetaling=${ready ? "klar" : "ufullstendig"}`,
  );
}

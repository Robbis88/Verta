import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Retur fra vaskerens Stripe Connect-onboarding. Speiler payouts_enabled og
 * sender vaskeren tilbake til portalen med en status.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.redirect(`${origin}/`);

  const supabase = createAdminClient();
  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id,stripe_connect_id")
    .eq("access_token", token)
    .maybeSingle();

  let enabled = false;
  if (stripe && cleaner?.stripe_connect_id) {
    try {
      const account = await stripe.accounts.retrieve(cleaner.stripe_connect_id);
      enabled = account.payouts_enabled === true;
      await supabase
        .from("cleaners")
        .update({ payouts_enabled: enabled })
        .eq("id", cleaner.id);
    } catch {
      enabled = false;
    }
  }

  return NextResponse.redirect(
    `${origin}/vasker/${token}?utbetaling=${enabled ? "klar" : "ufullstendig"}`,
  );
}

import { NextResponse } from "next/server";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

/**
 * Refresh-URL for Stripe Connect-onboarding. Stripe sender eieren hit hvis
 * Account Link-en er utløpt eller avbrutt — vi lager en ny lenke og sender
 * dem tilbake til onboarding.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  await requireUser();
  const profile = await getCurrentProfile();
  const connectId = profile?.stripe_connect_id;

  if (!stripe || !connectId) {
    return NextResponse.redirect(`${origin}/dashboard/settings`);
  }

  const link = await stripe.accountLinks.create({
    account: connectId,
    refresh_url: `${origin}/api/stripe/connect/refresh`,
    return_url: `${origin}/api/stripe/connect/return`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(link.url);
}

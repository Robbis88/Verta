"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { stripe, stripeEnabled, EXTRA_PROPERTY_PRICE_ID } from "@/lib/stripe";

async function siteOrigin(): Promise<string> {
  return (
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

/** Åpner Stripe Billing Portal så brukeren kan endre/si opp abonnement. */
export async function openBillingPortal(): Promise<void> {
  await requireUser();
  const profile = await getCurrentProfile();
  const customerId = profile?.stripe_customer_id;
  if (!stripe || !customerId) return;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${await siteOrigin()}/dashboard/settings`,
  });
  redirect(session.url);
}

/** Premium: kjøp en ekstra eiendom (+99 kr/mnd) via Stripe Checkout. */
export async function purchaseExtraProperty(): Promise<void> {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const customerId = profile?.stripe_customer_id;
  if (!stripe || !stripeEnabled || !EXTRA_PROPERTY_PRICE_ID || !customerId) {
    return;
  }

  const origin = await siteOrigin();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: EXTRA_PROPERTY_PRICE_ID, quantity: 1 }],
    success_url: `${origin}/dashboard/settings?extra=1`,
    cancel_url: `${origin}/dashboard/settings`,
    metadata: { user_id: user.id, type: "extra_property" },
  });
  redirect(session.url ?? `${origin}/dashboard/settings`);
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { stripe, stripeEnabled, EXTRA_PROPERTY_PRICE_ID } from "@/lib/stripe";

async function siteOrigin(): Promise<string> {
  return (
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

/**
 * Starter (eller gjenopptar) Stripe Connect-onboarding for eieren, slik at hen
 * kan motta utbetaling for gjeste-bookinger. Oppretter en Express-konto første
 * gang, og sender brukeren til Stripe sin onboarding via en Account Link.
 */
export async function startConnectOnboarding(): Promise<void> {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  if (!stripe || !stripeEnabled) return;

  const origin = await siteOrigin();
  let connectId = profile?.stripe_connect_id ?? null;

  if (!connectId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "NO",
      email: profile?.email ?? user.email ?? undefined,
      // Destination charges: plattformen tar betalingen, eierens konto mottar
      // overføringen. Da holder det å be om transfers-kapabiliteten.
      capabilities: { transfers: { requested: true } },
      // business_type settes ikke — Stripe spør eieren (privatperson vs. AS).
      metadata: { user_id: user.id },
    });
    connectId = account.id;
    const supabase = await createClient();
    await supabase
      .from("users")
      .update({ stripe_connect_id: connectId })
      .eq("id", user.id);
  }

  const link = await stripe.accountLinks.create({
    account: connectId,
    refresh_url: `${origin}/api/stripe/connect/refresh`,
    return_url: `${origin}/api/stripe/connect/return`,
    type: "account_onboarding",
  });

  redirect(link.url);
}

/**
 * Åpner Stripe Express-dashbordet for en eier som allerede er onboardet
 * (se utbetalinger, endre bankkonto osv.).
 */
export async function openConnectDashboard(): Promise<void> {
  await requireUser();
  const profile = await getCurrentProfile();
  if (!stripe || !profile?.stripe_connect_id) return;

  const link = await stripe.accounts.createLoginLink(profile.stripe_connect_id);
  redirect(link.url);
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

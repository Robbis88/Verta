"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, stripeEnabled } from "@/lib/stripe";

/** Gjesten betaler et skadekrav. Token-en er tilgangsnøkkelen. */
export async function payClaim(token: string): Promise<void> {
  const supabase = createAdminClient();
  const back = `/krav/${token}?feil=1`;

  const { data: claim } = await supabase
    .from("incident_claims")
    .select("id,amount,status,property_id,booking_id")
    .eq("claim_token", token)
    .maybeSingle();
  if (!claim || claim.status !== "pending") redirect(back);

  const { data: property } = await supabase
    .from("properties")
    .select("name,user_id")
    .eq("id", claim!.property_id)
    .single();
  const { data: owner } = property
    ? await supabase
        .from("users")
        .select("stripe_connect_id,payouts_enabled")
        .eq("id", property.user_id)
        .single()
    : { data: null };
  const { data: booking } = await supabase
    .from("bookings")
    .select("guest_email")
    .eq("id", claim!.booking_id)
    .maybeSingle();

  if (
    !stripe ||
    !stripeEnabled ||
    !owner?.payouts_enabled ||
    !owner?.stripe_connect_id
  ) {
    redirect(back);
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "nb",
    line_items: [
      {
        price_data: {
          currency: "nok",
          product_data: { name: `Skadekrav — ${property?.name ?? "opphold"}` },
          unit_amount: Math.round(Number(claim!.amount) * 100),
        },
        quantity: 1,
      },
    ],
    // Direct charge: hele beløpet betales direkte på eierens konto.
    payment_intent_data: { metadata: { claim_id: claim!.id, kind: "claim" } },
    customer_email: booking?.guest_email || undefined,
    metadata: { claim_id: claim!.id, kind: "claim" },
    success_url: `${origin}/krav/${token}?betalt=1`,
    cancel_url: `${origin}/krav/${token}`,
  }, {
    idempotencyKey: `claim-${claim!.id}`,
    stripeAccount: owner.stripe_connect_id,
  });

  redirect(session.url!);
}

import type Stripe from "stripe";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

/**
 * Retur-URL fra Stripe Checkout. Verifiserer sesjonen server-side og setter
 * planen med én gang, slik at betalingsmuren i dashbordet ikke bouncer brukeren
 * tilbake før webhooken rekker å oppdatere databasen. Webhooken gjør det samme
 * (idempotent) som en sikkerhetsnett.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const sessionId = url.searchParams.get("session_id");

  if (!stripe || !sessionId) {
    return NextResponse.redirect(`${origin}/hjem`);
  }

  const user = await requireUser();

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch {
    return NextResponse.redirect(`${origin}/onboarding/plan`);
  }

  // Sesjonen må tilhøre den innloggede brukeren.
  if (session.metadata?.user_id !== user.id) {
    return NextResponse.redirect(`${origin}/hjem`);
  }

  // Finn planen fra abonnementets price — kun hvis abonnementet er aktivt/trial.
  let plan: string | null = null;
  const sub = session.subscription;
  if (sub && typeof sub !== "string") {
    if (sub.status === "active" || sub.status === "trialing") {
      for (const item of sub.items.data) {
        const mapped = planFromPriceId(item.price.id);
        if (mapped) plan = mapped;
      }
    }
  }
  // Fallback til planen vi la i metadata da sesjonen ble opprettet.
  if (!plan && session.metadata?.plan) plan = session.metadata.plan;

  if (plan) {
    const supabase = await createClient();
    await supabase.from("users").update({ plan }).eq("id", user.id);
    return NextResponse.redirect(`${origin}/hjem`);
  }

  // Betaling ikke bekreftet (f.eks. avbrutt) — send tilbake til planvalg.
  return NextResponse.redirect(`${origin}/onboarding/plan`);
}

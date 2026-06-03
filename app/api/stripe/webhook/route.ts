import type Stripe from "stripe";

import { stripe, planFromPriceId, EXTRA_PROPERTY_PRICE_ID } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook. Oppdaterer users.plan og extra_properties_count basert på
 * abonnementsendringer. Bruker admin-klient (service role).
 */
export async function POST(request: Request) {
  if (!stripe) {
    return new Response("Stripe er ikke konfigurert", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return new Response("Mangler signatur", { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "ukjent feil";
    return new Response(`Ugyldig signatur: ${message}`, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = String(subscription.customer);

      // Finn plan fra abonnementets price-IDer.
      let plan: string | null = null;
      let extraProperties = 0;
      for (const item of subscription.items.data) {
        const priceId = item.price.id;
        if (priceId === EXTRA_PROPERTY_PRICE_ID) {
          extraProperties += item.quantity ?? 0;
          continue;
        }
        const mapped = planFromPriceId(priceId);
        if (mapped) plan = mapped;
      }

      const update: Record<string, unknown> = {
        extra_properties_count: extraProperties,
      };
      if (plan) update.plan = plan;

      await supabase
        .from("users")
        .update(update)
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("users")
        .update({ plan: "gratis", extra_properties_count: 0 })
        .eq("stripe_customer_id", String(subscription.customer));
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}

import type Stripe from "stripe";

import { stripe, planFromPriceId, EXTRA_PROPERTY_PRICE_ID } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeBooking, notifyRemainingPaid } from "@/lib/booking";
import { loggHendelse } from "@/lib/kontrollrom";

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

      // Betalingsmur: kun aktive/trialende (og past_due som nådefrist) gir
      // tilgang. Kansellert/ubetalt/utløpt → tilbake til gratis (låses ute).
      const harTilgang = ["active", "trialing", "past_due"].includes(
        subscription.status,
      );
      if (!harTilgang) {
        await supabase
          .from("users")
          .update({ plan: "gratis", extra_properties_count: 0 })
          .eq("stripe_customer_id", customerId);
        break;
      }

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

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const { data: bruker } = await supabase
        .from("users")
        .select("email")
        .eq("stripe_customer_id", String(invoice.customer))
        .maybeSingle();
      await loggHendelse({
        type: "system",
        alvorlighet: "warning",
        tittel: "Abonnementsbetaling feilet",
        detaljer: {
          kunde: bruker?.email ?? String(invoice.customer),
          belop: (invoice.amount_due ?? 0) / 100,
          forsok: invoice.attempt_count,
        },
        bruker_ref: bruker?.email ?? undefined,
      });
      break;
    }

    // Gjeste-booking betalt → bekreft bookingen og skaff tilkomst/e-post.
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) break; // abonnement-checkout, ikke en booking
      const kind = session.metadata?.kind;

      // Restbetaling: marker som betalt (bookingen er allerede bekreftet).
      if (kind === "remaining") {
        const { data: rp } = await supabase
          .from("bookings")
          .update({
            remaining_paid: true,
            remaining_payment_intent: session.payment_intent
              ? String(session.payment_intent)
              : null,
          })
          .eq("id", bookingId)
          .eq("remaining_paid", false)
          .select("id");
        if (rp && rp.length > 0) {
          await notifyRemainingPaid(bookingId);
        }
        break;
      }

      // Full betaling (instant) eller depositum (forespørsel): bekreft bookingen.
      // Idempotent — kun hvis fortsatt pending/approved (webhook kan gjenta).
      const { data: updated } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent
            ? String(session.payment_intent)
            : null,
          hold_expires_at: null,
        })
        .eq("id", bookingId)
        .in("status", ["pending", "approved"])
        .select("id");

      if (updated && updated.length > 0) {
        await finalizeBooking(bookingId);
      }
      break;
    }

    // Checkout utløp uten betaling → frigi reservasjonen så datoene åpnes igjen.
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) break;
      await supabase
        .from("bookings")
        .update({ status: "cancelled", payment_status: "failed" })
        .eq("id", bookingId)
        .eq("status", "pending");
      break;
    }

    // Connect: eierens onboarding-status endret seg. Speil payouts_enabled.
    // Krever at webhook-endepunktet også lytter på Connect-hendelser.
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await supabase
        .from("users")
        .update({ payouts_enabled: account.payouts_enabled === true })
        .eq("stripe_connect_id", account.id);
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}

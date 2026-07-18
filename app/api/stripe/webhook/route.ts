import type Stripe from "stripe";

import { stripe, planFromPriceId, isExtraPropertyPrice } from "@/lib/stripe";
import { propertyLimit, type Plan } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeBooking, notifyRemainingPaid } from "@/lib/booking";
import { sendClaimPaid, sendRentalPaid, sendStayExtraPaid } from "@/lib/email";
import { loggHendelse } from "@/lib/kontrollrom";
import { recordCriticalAlert } from "@/lib/critical-alerts";

/**
 * Sikkerhetsnett: en betaling kom inn, men vi fant ingen aktiv booking/ordre å
 * knytte den til. Vanligste årsaker: Connect-hendelser er ikke skrudd på (så
 * bekreftelsen kom aldri og holdet utløp), eller gjesten betalte etter at
 * reservasjonen ble frigitt. Logges som kritisk så pengene kan refunderes/følges
 * opp manuelt. Godartede webhook-replays (allerede bekreftet) alarmerer IKKE.
 */
async function alertOrphanPayment(
  session: Stripe.Checkout.Session,
  reason: string,
): Promise<void> {
  const detaljer = {
    arsak: reason,
    session_id: session.id,
    belop: (session.amount_total ?? 0) / 100,
    valuta: (session.currency ?? "").toUpperCase(),
    kind: session.metadata?.kind ?? "ukjent",
    referanse:
      session.metadata?.booking_id ??
      session.metadata?.rental_order_id ??
      session.metadata?.claim_id ??
      session.metadata?.request_id ??
      "ingen",
    betaling: session.payment_intent ? String(session.payment_intent) : "",
  };
  await loggHendelse({
    type: "system",
    alvorlighet: "critical",
    tittel: "Betaling uten match — sjekk webhook/Connect-oppsett",
    detaljer,
  });
  // Plattform-nivå (property_id null) → synlig for admin i dashbordet.
  await recordCriticalAlert({
    kind: "orphan_payment",
    title: `Betaling uten match (${(session.amount_total ?? 0) / 100} ${(
      session.currency ?? ""
    ).toUpperCase()})`,
    details: detaljer,
  });
}

/**
 * Regner ut brukerens plan + antall ekstra eiendommer på nytt fra ALLE kundens
 * abonnementer (ikke bare det som endret seg). Robust når ekstra eiendommer er
 * egne abonnementer: unngår at hoved- og ekstra-abonnement overskriver hverandre.
 * Ekstra kan være måneds- eller års-varianten.
 */
async function syncSubscriptionState(
  supabase: ReturnType<typeof createAdminClient>,
  customerId: string,
): Promise<void> {
  if (!stripe) return;
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });

  let plan: string | null = null;
  let extraProperties = 0;
  let mrrMonthly = 0; // sum av månedlig ekvivalent for alle linjer (år delt på 12)
  let interval: string | null = null;
  for (const s of subs.data) {
    // Kun aktive/trialende (past_due som nådefrist) teller.
    if (!["active", "trialing", "past_due"].includes(s.status)) continue;
    for (const item of s.items.data) {
      const priceId = item.price.id;
      const qty = item.quantity ?? 0;
      const unit = (item.price.unit_amount ?? 0) / 100;
      const yearly = item.price.recurring?.interval === "year";
      // MRR = faktisk betalende. Trials teller IKKE (ingen betaling ennå).
      if (s.status !== "trialing") {
        mrrMonthly += yearly ? (unit * qty) / 12 : unit * qty;
      }
      if (isExtraPropertyPrice(priceId)) {
        extraProperties += qty;
        continue;
      }
      const mapped = planFromPriceId(priceId);
      if (mapped) {
        plan = mapped;
        interval = yearly ? "year" : "month";
      }
    }
  }

  // Ingen aktiv hovedplan → gratis, null ekstra, null MRR (betalingsmuren låser).
  await supabase
    .from("users")
    .update({
      plan: plan ?? "gratis",
      extra_properties_count: plan ? extraProperties : 0,
      billing_interval: plan ? interval : null,
      mrr_nok: plan ? Math.round(mrrMonthly) : 0,
    })
    .eq("stripe_customer_id", customerId);

  // Håndhev eiendomsgrensen: av-list eiendommer utover ny grense (f.eks. etter
  // at ekstra-abonnementer er sagt opp). Beholder de eldste innenfor grensen.
  const { data: u } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (u?.id) {
    const limit = plan ? propertyLimit(plan as Plan, extraProperties) : 0;
    const { data: props } = await supabase
      .from("properties")
      .select("id")
      .eq("user_id", u.id)
      .order("created_at", { ascending: true });
    const over = (props ?? []).slice(limit).map((p) => p.id as string);
    if (over.length > 0) {
      await supabase.from("properties").update({ listed: false }).in("id", over);
    }
  }
}

/**
 * Stripe webhook. Oppdaterer users.plan og extra_properties_count basert på
 * abonnementsendringer. Bruker admin-klient (service role).
 */
export async function POST(request: Request) {
  if (!stripe) {
    return new Response("Stripe er ikke konfigurert", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  // To webhook-destinasjoner i Stripe: én for egen konto (abonnement, vask,
  // utleie) og én for Connected accounts (direktebookinger, skadekrav, eier-
  // onboarding). De har hver sin secret — vi prøver begge.
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_CONNECT,
  ].filter((s): s is string => Boolean(s));
  if (!signature || secrets.length === 0) {
    return new Response("Mangler signatur", { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event | null = null;
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
      break;
    } catch {
      // prøv neste secret
    }
  }
  if (!event) {
    return new Response("Ugyldig signatur", { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    // Alle abonnementsendringer → regn ut plan + ekstra på nytt fra hele kundens
    // abonnementsbilde (robust mot flere parallelle abonnementer).
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionState(supabase, String(subscription.customer));
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

      // Skadekrav betalt → marker som betalt og varsle eier.
      if (session.metadata?.kind === "claim") {
        const claimId = session.metadata.claim_id;
        if (claimId) {
          const { data: updated } = await supabase
            .from("incident_claims")
            .update({
              status: "paid",
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent
                ? String(session.payment_intent)
                : null,
            })
            .eq("id", claimId)
            .eq("status", "pending")
            .select("id,booking_id,property_id,amount");
          const claim = updated?.[0];
          if (claim) {
            const { data: property } = await supabase
              .from("properties")
              .select("name,user_id")
              .eq("id", claim.property_id)
              .single();
            const { data: booking } = await supabase
              .from("bookings")
              .select("guest_name")
              .eq("id", claim.booking_id)
              .single();
            const { data: owner } = property
              ? await supabase
                  .from("users")
                  .select("email")
                  .eq("id", property.user_id)
                  .single()
              : { data: null };
            if (owner?.email) {
              await sendClaimPaid({
                to: owner.email,
                propertyName: property?.name ?? "",
                guestName: booking?.guest_name ?? "Gjesten",
                amount: Number(claim.amount),
              });
            }
          } else {
            const { data: existing } = await supabase
              .from("incident_claims")
              .select("status")
              .eq("id", claimId)
              .maybeSingle();
            if (!existing || existing.status !== "paid") {
              await alertOrphanPayment(session, "skadekrav uten match");
            }
          }
        } else {
          await alertOrphanPayment(session, "skadekrav-betaling uten krav-id");
        }
        break;
      }

      // Utstyr leid → marker ordre betalt og varsle eier.
      if (session.metadata?.kind === "rental") {
        const orderId = session.metadata.rental_order_id;
        if (orderId) {
          const { data: updated } = await supabase
            .from("rental_orders")
            .update({
              status: "paid",
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent
                ? String(session.payment_intent)
                : null,
            })
            .eq("id", orderId)
            .eq("status", "pending")
            .select(
              "id,property_id,item_id,guest_name,guest_contact,quantity,days,amount",
            );
          const order = updated?.[0];
          if (order) {
            const { data: property } = await supabase
              .from("properties")
              .select("name,user_id")
              .eq("id", order.property_id)
              .single();
            const { data: item } = order.item_id
              ? await supabase
                  .from("rental_items")
                  .select("name")
                  .eq("id", order.item_id)
                  .single()
              : { data: null };
            const { data: owner } = property
              ? await supabase
                  .from("users")
                  .select("email")
                  .eq("id", property.user_id)
                  .single()
              : { data: null };
            if (owner?.email) {
              await sendRentalPaid({
                to: owner.email,
                propertyName: property?.name ?? "",
                itemName: item?.name ?? "utstyr",
                guestName: order.guest_name,
                quantity: order.quantity,
                days: order.days,
                amount: Number(order.amount),
                guestContact: order.guest_contact,
              });
            }
          } else {
            // 0 rader oppdatert: godartet replay (allerede paid) eller mangler.
            const { data: existing } = await supabase
              .from("rental_orders")
              .select("status")
              .eq("id", orderId)
              .maybeSingle();
            if (!existing || existing.status !== "paid") {
              await alertOrphanPayment(session, "leieordre uten match");
            }
          }
        } else {
          await alertOrphanPayment(session, "leiebetaling uten ordre-id");
        }
        break;
      }

      // Vaskeoppdrag betalt → marker service_request som betalt.
      if (session.metadata?.kind === "service") {
        const requestId = session.metadata.request_id;
        if (requestId) {
          const { data: paid } = await supabase
            .from("service_requests")
            .update({
              payment_status: "paid",
              stripe_payment_intent: session.payment_intent
                ? String(session.payment_intent)
                : null,
            })
            .eq("id", requestId)
            .eq("payment_status", "unpaid")
            .select("id");
          if (!paid || paid.length === 0) {
            const { data: existing } = await supabase
              .from("service_requests")
              .select("payment_status")
              .eq("id", requestId)
              .maybeSingle();
            if (!existing || existing.payment_status !== "paid") {
              await alertOrphanPayment(session, "vaskeoppdrag uten match");
            }
          }
        } else {
          await alertOrphanPayment(session, "vaskebetaling uten oppdrag-id");
        }
        break;
      }

      // Sen utsjekk / tidlig innsjekk kjøpt → marker bookingen og varsle eier.
      if (session.metadata?.kind === "stay_extra") {
        const bId = session.metadata.booking_id;
        const extraKind = session.metadata.extra_kind;
        const col =
          extraKind === "late_checkout"
            ? "late_checkout_paid"
            : extraKind === "early_checkin"
              ? "early_checkin_paid"
              : null;
        if (bId && col) {
          const { data: updated } = await supabase
            .from("bookings")
            .update({ [col]: true })
            .eq("id", bId)
            .eq("status", "confirmed")
            .eq(col, false)
            .select("id,property_id,guest_name");
          const row = updated?.[0];
          if (!row) {
            // 0 rader: godartet replay (allerede satt) eller foreldreløs
            // betaling (kansellert/feil booking) → alarmer.
            const { data: b } = await supabase
              .from("bookings")
              .select(col)
              .eq("id", bId)
              .maybeSingle();
            const alreadyPaid = b
              ? (b as Record<string, unknown>)[col] === true
              : false;
            if (!alreadyPaid) {
              await alertOrphanPayment(session, "stay_extra uten match");
            }
          }
          if (row) {
            const { data: property } = await supabase
              .from("properties")
              .select("name,user_id,late_checkout_price,early_checkin_price")
              .eq("id", row.property_id)
              .single();
            const { data: owner } = property
              ? await supabase
                  .from("users")
                  .select("email")
                  .eq("id", property.user_id)
                  .single()
              : { data: null };
            if (owner?.email && property) {
              const late = extraKind === "late_checkout";
              await sendStayExtraPaid({
                to: owner.email,
                propertyName: property.name ?? "",
                guestName: row.guest_name,
                label: late ? "Sen utsjekk" : "Tidlig innsjekk",
                amount: Number(
                  late
                    ? property.late_checkout_price
                    : property.early_checkin_price,
                ),
              });
            }
          }
        }
        break;
      }

      const bookingId = session.metadata?.booking_id;
      if (!bookingId) {
        // Abonnement-checkout har ingen booking_id (og mode = subscription) —
        // det er normalt. Men en BETALINGS-sesjon uten referanse er foreldreløs.
        if (session.mode === "payment") {
          await alertOrphanPayment(session, "betaling uten kjent referanse");
        }
        break;
      }
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
          .eq("status", "confirmed")
          .eq("remaining_paid", false)
          .select("id");
        if (rp && rp.length > 0) {
          await notifyRemainingPaid(bookingId);
        } else {
          // 0 rader: godartet replay (allerede betalt) eller foreldreløs
          // betaling (bookingen er kansellert/mangler) → alarmer.
          const { data: b } = await supabase
            .from("bookings")
            .select("remaining_paid")
            .eq("id", bookingId)
            .maybeSingle();
          if (!b?.remaining_paid) {
            await alertOrphanPayment(
              session,
              "restbetaling uten aktiv booking",
            );
          }
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
      } else {
        // 0 rader: enten godartet replay (allerede bekreftet) eller foreldreløs
        // betaling (bookingen er kansellert/frigitt eller mangler) → alarmer.
        const { data: b } = await supabase
          .from("bookings")
          .select("status,payment_status")
          .eq("id", bookingId)
          .maybeSingle();
        if (!b) {
          await alertOrphanPayment(session, "bookingen finnes ikke");
        } else if (b.status !== "confirmed") {
          await alertOrphanPayment(
            session,
            `betalt, men bookingen er «${b.status}» (ikke bekreftet)`,
          );
        }
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
      const enabled = account.payouts_enabled === true;
      // Kontoen kan tilhøre en utleier (users) eller en vasker (cleaners).
      await supabase
        .from("users")
        .update({ payouts_enabled: enabled })
        .eq("stripe_connect_id", account.id);
      await supabase
        .from("cleaners")
        .update({ payouts_enabled: enabled })
        .eq("stripe_connect_id", account.id);
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { bookingSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { propertyLimit, type BookingSource } from "@/lib/constants";
import { finalizeBooking } from "@/lib/booking";
import { sendRequestNotices } from "@/lib/email";
import { quoteBookingTotal, type Quote } from "@/lib/pricing";
import { loggHendelse } from "@/lib/kontrollrom";

export type BookingFormState = {
  error?: string;
  success?: boolean;
  requested?: boolean;
  fieldErrors?: Record<string, string>;
};

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

/** Kildekode fra en delt lenke (?kilde=) → booking-source for attribusjon. */
function mapSource(raw: string | undefined): BookingSource {
  if (raw === "instagram") return "verta_instagram";
  if (raw === "facebook") return "verta_facebook";
  return "verta_direct";
}

async function siteOrigin(): Promise<string> {
  return (
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

/**
 * Oppretter en direkte booking fra den offentlige booking-siden.
 * Har eieren aktivert utbetaling (Stripe Connect) og eiendommen en pris, holdes
 * datoene som `pending` og gjesten sendes til Stripe Checkout — bookingen
 * bekreftes først når betalingen er gjennomført (via webhook). Ellers opprettes
 * en gratis forespørsel som før (eier tar kontakt).
 * Gjesten er ikke innlogget, så vi bruker admin-klienten (omgår RLS).
 */
export async function createDirectBooking(
  slug: string,
  sourceRaw: string | undefined,
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;
  const source = mapSource(sourceRaw);

  const supabase = createAdminClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id,user_id,name,booking_mode")
    .eq("slug", slug)
    .single();

  if (!property) return { error: "Fant ikke eiendommen" };

  // Overlapp-sjekk mot bookinger som faktisk låser datoene (forespørsler og
  // kansellerte teller ikke — flere kan forespørre samme dato).
  const { data: clashes } = await supabase
    .from("bookings")
    .select("id")
    .eq("property_id", property.id)
    .not("status", "in", "(cancelled,requested)")
    .lt("check_in", data.check_out)
    .gt("check_out", data.check_in);

  if (clashes && clashes.length > 0) {
    return { error: "Disse datoene er dessverre opptatt. Velg andre datoer." };
  }

  const nights = nightsBetween(data.check_in, data.check_out);
  const quote = await quoteBookingTotal(
    property.id,
    data.check_in,
    data.check_out,
  );
  const total = quote?.total ?? null; // utleierens inntekt (netter + rengjøring)
  const serviceFee = quote?.serviceFee ?? 0; // Vertas gebyr (gjesten betaler)
  const guestTotal = quote?.guestTotal ?? null; // det gjesten betaler totalt

  // Hent eier én gang: e-post + Connect-status + plan + antall ekstra.
  const { data: owner } = await supabase
    .from("users")
    .select("email,stripe_connect_id,payouts_enabled,plan,extra_properties_count")
    .eq("id", property.user_id)
    .single();

  // Er denne eiendommen dekket av et aktivt abonnement innenfor grensen?
  // Oppsagt (gratis) eier → nei. Premium-eier som har sagt opp ekstra-plasser →
  // kun de eldste (innenfor grensen) er dekket. Ellers faller bookingen til
  // forespørsel (ingen betaling), så ingen driver tjenesten uten å betale.
  let withinPlan = false;
  if (owner?.plan === "premium") {
    const limit = propertyLimit(
      "premium",
      owner.extra_properties_count ?? 0,
    );
    const { data: owned } = await supabase
      .from("properties")
      .select("id")
      .eq("user_id", property.user_id)
      .order("created_at", { ascending: true })
      .limit(limit);
    withinPlan = (owned ?? []).some((p) => p.id === property.id);
  }

  const canCharge = Boolean(
    stripe &&
      stripeEnabled &&
      withinPlan &&
      owner?.payouts_enabled &&
      owner?.stripe_connect_id &&
      total &&
      total > 0,
  );
  const isPaidProperty = Boolean(total && total > 0);

  // Forespørsel opprettes hvis eieren har valgt det, ELLER hvis eiendommen har
  // pris men eieren ikke kan ta betaling ennå. Det siste er viktig: uten dette
  // ville en betalt eiendom blitt auto-bekreftet GRATIS (med dørkode) når eier
  // ikke har koblet Stripe. Da lar vi eieren godkjenne manuelt i stedet.
  const asRequest =
    property.booking_mode === "request" || (isPaidProperty && !canCharge);

  if (asRequest) {
    const { data: booking, error: reqErr } = await supabase
      .from("bookings")
      .insert({
        property_id: property.id,
        guest_name: data.guest_name,
        guest_email: data.guest_email || null,
        guest_phone: data.guest_phone || null,
        check_in: data.check_in,
        check_out: data.check_out,
        nights,
        total_price: total,
        amount_total: guestTotal,
        service_fee: serviceFee,
        num_guests: data.num_guests ?? null,
        guest_message: data.guest_message || null,
        source,
        status: "requested",
      })
      .select("id,owner_token")
      .single();

    if (reqErr) return { error: reqErr.message };

    await logAudit({
      user_id: property.user_id,
      action: "booking.requested",
      resource_type: "booking",
      resource_id: booking.id,
      changes: { source },
    });

    await sendRequestNotices({
      ownerEmail: owner?.email ?? null,
      guestEmail: data.guest_email || null,
      guestName: data.guest_name,
      guestPhone: data.guest_phone || null,
      propertyName: property.name,
      checkIn: data.check_in,
      checkOut: data.check_out,
      numGuests: data.num_guests ?? null,
      message: data.guest_message || null,
      ownerToken: booking.owner_token,
    });

    return { success: true, requested: true };
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      property_id: property.id,
      guest_name: data.guest_name,
      guest_email: data.guest_email || null,
      guest_phone: data.guest_phone || null,
      check_in: data.check_in,
      check_out: data.check_out,
      nights,
      total_price: total,
      source,
      status: canCharge ? "pending" : "confirmed",
      ...(canCharge
        ? {
            payment_status: "pending",
            amount_total: guestTotal,
            service_fee: serviceFee,
            hold_expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
          }
        : {}),
    })
    .select("id,guest_token")
    .single();

  if (error) {
    // 23P01 = exclusion_violation (bookings_no_overlap) — tapt kappløp om datoene.
    if (error.code === "23P01") {
      return { error: "Disse datoene ble nettopp opptatt. Velg andre datoer." };
    }
    return { error: error.message };
  }

  await logAudit({
    user_id: property.user_id,
    action: "booking.created",
    resource_type: "booking",
    resource_id: booking.id,
    changes: { source, paid: canCharge },
  });

  // Gratis-flyt: bekreft med en gang (tilkomst + e-post) og vis kvittering.
  if (!canCharge) {
    await loggHendelse({
      type: "system",
      alvorlighet: "info",
      tittel: `Ny booking · ${property.name}`,
      detaljer: {
        gjest: data.guest_name,
        innsjekk: data.check_in,
        utsjekk: data.check_out,
        kilde: source,
      },
      bruker_ref: data.guest_name,
    });
    await finalizeBooking(booking.id);
    return { success: true };
  }

  // Betalings-flyt: direct charge på eierens konto. Gjesten betaler hele beløpet
  // direkte til eieren (0 % til Verta). Betalingsmetoder (kort, Klarna) styres av
  // det som er aktivert i Stripe.
  const origin = await siteOrigin();
  const session = await stripe!.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    locale: "nb",
    line_items: [
      {
        price_data: {
          currency: "nok",
          product_data: {
            name: `${property.name} — ${nights} ${nights === 1 ? "natt" : "netter"}`,
          },
          unit_amount: Math.round((guestTotal as number) * 100),
        },
        quantity: 1,
      },
    ],
    payment_intent_data: { metadata: { booking_id: booking.id } },
    customer_email: data.guest_email || undefined,
    metadata: { booking_id: booking.id },
    success_url: `${origin}/bo/${slug}?betalt=1`,
    cancel_url: `${origin}/bo/${slug}?avbrutt=1`,
    // Reservasjonen holdes i 30 min; utløper checkouten frigis datoene.
    expires_at: Math.floor(Date.now() / 1000) + 1800,
  }, {
    idempotencyKey: `booking-${booking.id}`,
    stripeAccount: owner!.stripe_connect_id!,
  });

  redirect(session.url!);
}

/**
 * Beregner et pristilbud for visning i booking-skjemaet før gjesten sender inn.
 * Returnerer null hvis eiendommen ikke har priser satt eller datoene er ugyldige.
 */
export async function quoteBooking(
  slug: string,
  checkIn: string,
  checkOut: string,
): Promise<Quote | null> {
  if (!checkIn || !checkOut || checkOut <= checkIn) return null;
  const supabase = createAdminClient();
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!property) return null;
  return quoteBookingTotal(property.id, checkIn, checkOut);
}

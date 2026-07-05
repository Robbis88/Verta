"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { bookingSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { commissionRate } from "@/lib/constants";
import type { BookingSource } from "@/lib/constants";
import { finalizeBooking } from "@/lib/booking";
import { sendRequestNotices } from "@/lib/email";
import { calculateBookingTotal, quoteBookingTotal, type Quote } from "@/lib/pricing";
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
  const total = await calculateBookingTotal(
    property.id,
    data.check_in,
    data.check_out,
  );

  // Forespørsel-modus: opprett en 'requested' booking (ingen datolås, ingen
  // betaling), samle gjeste-info, og varsle eier + gjest. Eier godkjenner.
  if (property.booking_mode === "request") {
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
        amount_total: total,
        num_guests: data.num_guests ?? null,
        guest_message: data.guest_message || null,
        source,
        status: "requested",
      })
      .select("id")
      .single();

    if (reqErr) return { error: reqErr.message };

    await logAudit({
      user_id: property.user_id,
      action: "booking.requested",
      resource_type: "booking",
      resource_id: booking.id,
      changes: { source },
    });

    const { data: owner } = await supabase
      .from("users")
      .select("email")
      .eq("id", property.user_id)
      .single();

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
    });

    return { success: true, requested: true };
  }

  // Kan vi kreve betaling? Eieren må ha ferdig Connect-onboarding og en pris.
  const { data: owner } = await supabase
    .from("users")
    .select("stripe_connect_id,payouts_enabled")
    .eq("id", property.user_id)
    .single();

  const canCharge = Boolean(
    stripe &&
      stripeEnabled &&
      owner?.payouts_enabled &&
      owner?.stripe_connect_id &&
      total &&
      total > 0,
  );

  const rate = commissionRate(source);
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
            amount_total: total,
            application_fee: Math.round((total as number) * rate * 100) / 100,
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

  // Betalings-flyt: Stripe Checkout med destination charge til eieren.
  // application_fee er Vertas provisjon; resten overføres til eierens konto.
  // Betalingsmetoder (kort, Klarna) styres av det som er aktivert i Stripe.
  const origin = await siteOrigin();
  const session = await stripe!.checkout.sessions.create({
    mode: "payment",
    locale: "nb",
    line_items: [
      {
        price_data: {
          currency: "nok",
          product_data: {
            name: `${property.name} — ${nights} ${nights === 1 ? "natt" : "netter"}`,
          },
          unit_amount: Math.round((total as number) * 100),
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: Math.round((total as number) * rate * 100),
      transfer_data: { destination: owner!.stripe_connect_id! },
      metadata: { booking_id: booking.id },
    },
    customer_email: data.guest_email || undefined,
    metadata: { booking_id: booking.id },
    success_url: `${origin}/properties/${slug}?betalt=1`,
    cancel_url: `${origin}/properties/${slug}?avbrutt=1`,
    // Reservasjonen holdes i 30 min; utløper checkouten frigis datoene.
    expires_at: Math.floor(Date.now() / 1000) + 1800,
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

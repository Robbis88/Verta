"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { cancelAndRefund } from "@/lib/booking";
import { refundFractionForCheckIn } from "@/lib/cancellation";
import { stripe, stripeEnabled } from "@/lib/stripe";

export type GuestCancelResult = { ok: boolean; message: string };

/**
 * Gjesten legger igjen en anmeldelse etter oppholdet. Token-en er tilgangs-
 * nøkkelen. Kun tillatt når oppholdet er bekreftet og utsjekk har passert;
 * unik indeks på booking_id hindrer dobbelt-anmeldelse.
 */
export async function submitReview(
  token: string,
  formData: FormData,
): Promise<void> {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id,property_id,guest_name,status,check_out")
    .eq("guest_token", token)
    .maybeSingle();
  if (!booking) return;

  const today = new Date().toISOString().slice(0, 10);
  const stayOver = booking.check_out <= today;
  if (booking.status !== "confirmed" || !stayOver) return;

  const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 0));
  if (rating < 1) return;
  const comment = String(formData.get("comment") ?? "").trim() || null;

  await supabase.from("property_reviews").insert({
    property_id: booking.property_id,
    booking_id: booking.id,
    guest_name: booking.guest_name,
    rating,
    comment,
  });

  revalidatePath(`/gjest/${token}`);
}

/**
 * Gjesten betaler depositumet på en godkjent forespørsel for å låse oppholdet.
 * Oppretter Stripe Checkout (destination charge) og redirecter. Webhooken
 * bekrefter bookingen ved betaling. Token-en er tilgangsnøkkelen.
 */
export async function payDeposit(token: string): Promise<void> {
  const supabase = createAdminClient();
  const back = `/gjest/${token}?feil=1`;

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id,status,deposit_amount,amount_total,service_fee,property_id,guest_email,hold_expires_at,source",
    )
    .eq("guest_token", token)
    .maybeSingle();

  if (!booking || booking.status !== "approved") redirect(back);
  if (
    booking!.hold_expires_at &&
    new Date(booking!.hold_expires_at).getTime() < Date.now()
  ) {
    redirect(back);
  }

  const { data: property } = await supabase
    .from("properties")
    .select("name,user_id")
    .eq("id", booking!.property_id)
    .single();
  const { data: owner } = property
    ? await supabase
        .from("users")
        .select("stripe_connect_id,payouts_enabled")
        .eq("id", property.user_id)
        .single()
    : { data: null };

  const deposit = Number(booking!.deposit_amount ?? 0);
  if (
    !stripe ||
    !stripeEnabled ||
    !owner?.payouts_enabled ||
    !owner?.stripe_connect_id ||
    deposit <= 0
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
          product_data: { name: `Depositum — ${property?.name ?? "opphold"}` },
          unit_amount: Math.round(deposit * 100),
        },
        quantity: 1,
      },
    ],
    payment_intent_data: { metadata: { booking_id: booking.id, kind: "deposit" } },
    customer_email: booking.guest_email || undefined,
    metadata: { booking_id: booking.id, kind: "deposit" },
    success_url: `${origin}/gjest/${token}?betalt=1`,
    cancel_url: `${origin}/gjest/${token}`,
  }, {
    idempotencyKey: `deposit-${booking!.id}`,
    stripeAccount: owner.stripe_connect_id,
  });

  redirect(session.url!);
}

/**
 * Gjesten betaler restbeløpet (siste 50 %) på en bekreftet booking.
 * Oppretter Stripe Checkout (kind: remaining); webhooken markerer remaining_paid.
 */
export async function payRemaining(token: string): Promise<void> {
  const supabase = createAdminClient();
  const back = `/gjest/${token}?feil=1`;

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id,status,remaining_amount,remaining_paid,amount_total,service_fee,property_id,guest_email,source",
    )
    .eq("guest_token", token)
    .maybeSingle();

  if (!booking || booking.status !== "confirmed" || booking.remaining_paid) {
    redirect(back);
  }
  const remaining = Number(booking!.remaining_amount ?? 0);
  if (remaining <= 0) redirect(back);

  const { data: property } = await supabase
    .from("properties")
    .select("name,user_id")
    .eq("id", booking!.property_id)
    .single();
  const { data: owner } = property
    ? await supabase
        .from("users")
        .select("stripe_connect_id,payouts_enabled")
        .eq("id", property.user_id)
        .single()
    : { data: null };

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
          product_data: { name: `Restbeløp — ${property?.name ?? "opphold"}` },
          unit_amount: Math.round(remaining * 100),
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      metadata: { booking_id: booking!.id, kind: "remaining" },
    },
    customer_email: booking!.guest_email || undefined,
    metadata: { booking_id: booking!.id, kind: "remaining" },
    success_url: `${origin}/gjest/${token}?betalt=1`,
    cancel_url: `${origin}/gjest/${token}`,
  }, {
    idempotencyKey: `remaining-${booking!.id}`,
    stripeAccount: owner.stripe_connect_id,
  });

  redirect(session.url!);
}

/**
 * Gjesten kjøper sen utsjekk eller tidlig innsjekk (betalt tillegg). Direct
 * charge rett til eierens konto — en forlengelse av oppholdet, 0 % til Verta.
 * Webhooken markerer bookingen betalt.
 */
export async function payStayExtra(
  token: string,
  kind: string,
): Promise<void> {
  const supabase = createAdminClient();
  const back = `/gjest/${token}?feil=1`;
  if (kind !== "late_checkout" && kind !== "early_checkin") redirect(back);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id,status,property_id,guest_email,late_checkout_paid,early_checkin_paid",
    )
    .eq("guest_token", token)
    .maybeSingle();
  if (!booking || booking.status !== "confirmed") redirect(back);
  const alreadyPaid =
    kind === "late_checkout"
      ? booking!.late_checkout_paid
      : booking!.early_checkin_paid;
  if (alreadyPaid) redirect(`/gjest/${token}`);

  const { data: property } = await supabase
    .from("properties")
    .select("name,user_id,late_checkout_price,early_checkin_price")
    .eq("id", booking!.property_id)
    .single();
  const price =
    kind === "late_checkout"
      ? Number(property?.late_checkout_price ?? 0)
      : Number(property?.early_checkin_price ?? 0);
  if (!property || price <= 0) redirect(back);

  const { data: owner } = await supabase
    .from("users")
    .select("stripe_connect_id,payouts_enabled")
    .eq("id", property.user_id)
    .single();
  if (
    !stripe ||
    !stripeEnabled ||
    !owner?.payouts_enabled ||
    !owner?.stripe_connect_id
  ) {
    redirect(back);
  }

  const label = kind === "late_checkout" ? "Sen utsjekk" : "Tidlig innsjekk";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      locale: "nb",
      line_items: [
        {
          price_data: {
            currency: "nok",
            product_data: { name: `${label} — ${property.name}` },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: { booking_id: booking!.id, kind: "stay_extra", extra_kind: kind },
      },
      customer_email: booking!.guest_email || undefined,
      metadata: { booking_id: booking!.id, kind: "stay_extra", extra_kind: kind },
      success_url: `${origin}/gjest/${token}?ekstra=1`,
      cancel_url: `${origin}/gjest/${token}`,
    },
    {
      idempotencyKey: `stayextra-${kind}-${booking!.id}`,
      stripeAccount: owner.stripe_connect_id,
    },
  );

  redirect(session.url!);
}

/**
 * Gjesten avbestiller sitt eget opphold via den tokeniserte gjestesiden.
 * Token-en (guest_token) er tilgangsnøkkelen — ingen innlogging. Refusjon
 * beregnes fra kanselleringspolicyen ut fra hvor lenge før innsjekk det er.
 */
export async function cancelBookingAsGuest(
  token: string,
): Promise<GuestCancelResult> {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id,check_in,status")
    .eq("guest_token", token)
    .maybeSingle();

  if (!booking) return { ok: false, message: "Fant ikke bookingen." };
  if (booking.status === "cancelled") {
    return { ok: false, message: "Oppholdet er allerede avbestilt." };
  }

  const fraction = refundFractionForCheckIn(booking.check_in);
  const res = await cancelAndRefund({
    bookingId: booking.id,
    refundFraction: fraction,
  });

  if (!res.ok) {
    return { ok: false, message: "Klarte ikke avbestille. Prøv igjen." };
  }

  revalidatePath(`/gjest/${token}`);

  if (!res.wasPaid) {
    return { ok: true, message: "Oppholdet er avbestilt." };
  }
  if (res.refundPending) {
    return {
      ok: true,
      message:
        "Oppholdet er avbestilt. Refusjonen behandles og kommer på kortet ditt så snart som mulig.",
    };
  }
  if (res.refunded > 0) {
    return {
      ok: true,
      message: `Oppholdet er avbestilt. ${
        fraction === 1 ? "Hele beløpet" : "50 %"
      } refunderes til kortet ditt.`,
    };
  }
  return {
    ok: true,
    message:
      "Oppholdet er avbestilt. Ifølge avbestillingsreglene refunderes ikke beløpet siden det er under 48 timer til innsjekk.",
  };
}

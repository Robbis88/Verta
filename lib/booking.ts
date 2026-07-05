import { createAdminClient } from "@/lib/supabase/admin";
import { provisionBookingAccess } from "@/lib/access";
import { stripe } from "@/lib/stripe";
import { seamEnabled, removeAccessCode } from "@/lib/seam";
import {
  hoursToRemainingDeadline,
  remainingDueDate,
} from "@/lib/cancellation";
import {
  sendBookingConfirmation,
  sendOwnerBookingNotification,
  sendCancellationNotices,
  sendRemainingReceipt,
  sendRemainingDue,
} from "@/lib/email";

/**
 * Fullfører en bekreftet booking: skaffer tilkomst (smartlås-kode eller
 * nøkkelboks-info) og sender bekreftelse til gjest + varsel til eier.
 * Idempotent på adgang (hopper over hvis koden allerede finnes). Kalles både
 * fra gratis-flyten (uten betaling) og fra betalings-webhooken.
 */
export async function finalizeBooking(bookingId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id,property_id,guest_name,guest_email,check_in,check_out,nights,guest_token,access_code,remaining_amount,remaining_paid",
    )
    .eq("id", bookingId)
    .single();
  if (!booking) return;

  // Depositum-flyt: gjenstår det en rest som ikke er betalt, endres ordlyden
  // i e-postene (depositum betalt vs. full booking).
  const remainingDue = booking.remaining_paid
    ? 0
    : Number(booking.remaining_amount ?? 0);

  const { data: property } = await supabase
    .from("properties")
    .select("id,user_id,name,access_info")
    .eq("id", booking.property_id)
    .single();
  if (!property) return;

  // Skaff tilkomst kun hvis den ikke allerede er skaffet (webhook kan gjenta).
  let access = null as Awaited<ReturnType<typeof provisionBookingAccess>>;
  if (!booking.access_code) {
    access = await provisionBookingAccess({
      propertyId: property.id,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      label: `Verta · ${booking.guest_name}`,
      accessInfo: property.access_info,
    });
    if (access?.type === "smartlock") {
      await supabase
        .from("bookings")
        .update({ access_code: access.code, access_code_id: access.accessCodeId })
        .eq("id", booking.id);
    }
  } else {
    access = { type: "smartlock", code: booking.access_code, accessCodeId: "" };
  }

  const { data: owner } = await supabase
    .from("users")
    .select("email")
    .eq("id", property.user_id)
    .single();

  await Promise.allSettled([
    booking.guest_email
      ? sendBookingConfirmation({
          to: booking.guest_email,
          guestName: booking.guest_name,
          propertyName: property.name,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          nights: booking.nights ?? 1,
          access,
          guideToken: booking.guest_token,
          remainingAmount: remainingDue > 0 ? remainingDue : undefined,
        })
      : Promise.resolve(false),
    owner?.email
      ? sendOwnerBookingNotification({
          to: owner.email,
          propertyName: property.name,
          guestName: booking.guest_name,
          guestEmail: booking.guest_email || null,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          remainingAmount: remainingDue > 0 ? remainingDue : undefined,
        })
      : Promise.resolve(false),
  ]);
}

/**
 * Kansellerer en booking, refunderer gjesten etter `refundFraction` (1 = alt,
 * 0.5 = halvparten, 0 = ingenting) og varsler gjest + eier. Trekker også
 * tilbake en evt. smartlås-kode. Idempotent (hopper over allerede kansellerte).
 * Bruker admin-klient — kalleren er ansvarlig for tilgangskontroll.
 */
export async function cancelAndRefund(opts: {
  bookingId: string;
  refundFraction: number;
  nonPayment?: boolean;
}): Promise<{ ok: boolean; refunded: number; wasPaid: boolean }> {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id,property_id,guest_name,guest_email,check_in,check_out,status,access_code_id,payment_status,stripe_payment_intent,amount_total",
    )
    .eq("id", opts.bookingId)
    .maybeSingle();
  if (!booking || booking.status === "cancelled") {
    return { ok: false, refunded: 0, wasPaid: false };
  }

  const fraction = Math.max(0, Math.min(1, opts.refundFraction));
  const wasPaid =
    booking.payment_status === "paid" && !!booking.stripe_payment_intent;
  const total = Number(booking.amount_total ?? 0);
  const refundAmount =
    wasPaid && fraction > 0 ? Math.round(total * fraction * 100) / 100 : 0;

  // Marker kansellert (idempotent via status-guard). Refundert-status kun hvis
  // faktisk refundert; ellers beholdes 'paid' (beløpet er beholdt).
  const { data: updated } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      access_code: null,
      access_code_id: null,
      ...(refundAmount > 0 ? { payment_status: "refunded" } : {}),
    })
    .eq("id", booking.id)
    .neq("status", "cancelled")
    .select("id");
  if (!updated || updated.length === 0) {
    return { ok: false, refunded: 0, wasPaid };
  }

  // Trekk tilbake smartlås-kode.
  if (seamEnabled && booking.access_code_id) {
    try {
      await removeAccessCode(booking.access_code_id);
    } catch (err) {
      console.error("Klarte ikke trekke tilbake smartlås-kode:", err);
    }
  }

  // Refunder gjesten (proporsjonalt), og reverser eier-overføring + provisjon.
  if (stripe && refundAmount > 0) {
    try {
      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent!,
        // Utelat amount ved full refusjon (unngår avrundingsavvik).
        ...(fraction < 1
          ? { amount: Math.round(total * fraction * 100) }
          : {}),
        refund_application_fee: true,
        reverse_transfer: true,
      });
    } catch (err) {
      console.error("Refusjon feilet:", err);
    }
  }

  // Varsle gjest + eier.
  const { data: property } = await supabase
    .from("properties")
    .select("name,user_id")
    .eq("id", booking.property_id)
    .single();
  const { data: owner } = property
    ? await supabase
        .from("users")
        .select("email")
        .eq("id", property.user_id)
        .single()
    : { data: null };

  await sendCancellationNotices({
    guestEmail: booking.guest_email,
    ownerEmail: owner?.email ?? null,
    guestName: booking.guest_name,
    propertyName: property?.name ?? "",
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    wasPaid,
    refundAmount,
    nonPayment: opts.nonPayment,
  });

  return { ok: true, refunded: refundAmount, wasPaid };
}

/**
 * Sender kvittering til gjest + eier når restbeløpet er betalt. Kalles fra
 * webhooken etter at remaining_paid er satt.
 */
export async function notifyRemainingPaid(bookingId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id,guest_name,guest_email,remaining_amount,property_id")
    .eq("id", bookingId)
    .single();
  if (!booking) return;

  const { data: property } = await supabase
    .from("properties")
    .select("name,user_id")
    .eq("id", booking.property_id)
    .single();
  const { data: owner } = property
    ? await supabase
        .from("users")
        .select("email")
        .eq("id", property.user_id)
        .single()
    : { data: null };

  await sendRemainingReceipt({
    guestEmail: booking.guest_email,
    ownerEmail: owner?.email ?? null,
    guestName: booking.guest_name,
    propertyName: property?.name ?? "",
    amount: Number(booking.remaining_amount ?? 0),
  });
}

/**
 * Restbetalings-motor (kjøres av cron): for bekreftede bookinger med ubetalt
 * rest og fremtidig innsjekk sendes varsel 48t og 24t før fristen (7 dager før
 * innsjekk). Passeres fristen uten betaling, avbestilles bookingen og
 * depositumet beholdes (ingen refusjon). Returnerer antall varslet/avbestilt.
 */
export async function processRemainingPayments(): Promise<{
  warned: number;
  cancelled: number;
}> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: rows } = await supabase
    .from("bookings")
    .select(
      "id,guest_name,guest_email,remaining_amount,check_in,property_id,guest_token,remaining_warn_stage",
    )
    .eq("status", "confirmed")
    .eq("remaining_paid", false)
    .gt("remaining_amount", 0)
    .gte("check_in", today);

  const bookings = rows ?? [];
  let warned = 0;
  let cancelled = 0;

  for (const b of bookings) {
    const hrs = hoursToRemainingDeadline(b.check_in);

    // Frist passert → avbestill og behold depositum.
    if (hrs <= 0) {
      const res = await cancelAndRefund({
        bookingId: b.id,
        refundFraction: 0,
        nonPayment: true,
      });
      if (res.ok) cancelled += 1;
      continue;
    }

    // Varsle 48t og 24t før fristen (én gang hver, via warn_stage).
    const stage = b.remaining_warn_stage ?? 0;
    let newStage = stage;
    if (hrs <= 24 && stage < 2) newStage = 2;
    else if (hrs <= 48 && stage < 1) newStage = 1;

    if (newStage !== stage && b.guest_email) {
      const { data: property } = await supabase
        .from("properties")
        .select("name")
        .eq("id", b.property_id)
        .single();
      await sendRemainingDue({
        to: b.guest_email,
        guestName: b.guest_name,
        propertyName: property?.name ?? "",
        dueDate: remainingDueDate(b.check_in),
        remainingAmount: Number(b.remaining_amount ?? 0),
        payToken: b.guest_token,
      });
      await supabase
        .from("bookings")
        .update({ remaining_warn_stage: newStage })
        .eq("id", b.id);
      warned += 1;
    }
  }

  return { warned, cancelled };
}

/**
 * Frigjør utløpte reservasjoner: pending bookinger der hold_expires_at har
 * passert settes til cancelled, så datoene åpnes igjen. Backup for
 * checkout.session.expired-webhooken. Returnerer antall frigjorte.
 */
export async function releaseExpiredHolds(): Promise<number> {
  const supabase = createAdminClient();
  // Både pending (checkout påbegynt) og approved (venter depositum) holder
  // datoene med en frist. Utløper den, frigis datoene.
  const { data } = await supabase
    .from("bookings")
    .update({ status: "cancelled", payment_status: "failed" })
    .in("status", ["pending", "approved"])
    .lt("hold_expires_at", new Date().toISOString())
    .select("id");
  return data?.length ?? 0;
}

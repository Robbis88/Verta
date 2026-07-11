import { createAdminClient } from "@/lib/supabase/admin";
import { hoursToRemainingDeadline } from "@/lib/cancellation";
import { sendBookingApproved, sendBookingRejected } from "@/lib/email";

export type ApproveResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "no_payouts" | "conflict" };

/**
 * Kjernelogikk for å godkjenne en bookingforespørsel. Deles av dashbordet
 * (innlogget eier) og e-post-lenken (/godkjenn/[token]). Bruker admin-klient;
 * kalleren er ansvarlig for tilgangskontroll (RLS-eierskap eller token).
 *
 * Setter depositum/rest (full betaling ved kortvarsel), holder datoene i 24t og
 * sender godkjennings-e-post til gjesten.
 */
export async function approveRequest(bookingId: string): Promise<ApproveResult> {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id,status,amount_total,guest_email,guest_name,check_in,check_out,guest_token,property_id",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking || booking.status !== "requested") {
    return { ok: false, reason: "not_found" };
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id,user_id,name")
    .eq("id", booking.property_id)
    .single();
  const { data: owner } = property
    ? await supabase
        .from("users")
        .select("email,payouts_enabled")
        .eq("id", property.user_id)
        .single()
    : { data: null };

  // Uten aktiv utbetaling kan ikke gjesten belastes — da kan vi ikke godkjenne.
  if (!owner?.payouts_enabled) return { ok: false, reason: "no_payouts" };

  const total = Number(booking.amount_total ?? 0);
  // Innsjekk nærmere enn restfristen (7 dager) → full betaling nå, ingen rest.
  const fullUpfront = hoursToRemainingDeadline(booking.check_in) <= 0;
  const deposit = fullUpfront ? total : Math.round(total * 0.5 * 100) / 100;
  const remaining = Math.round((total - deposit) * 100) / 100;
  const holdExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      deposit_amount: deposit,
      remaining_amount: remaining,
      hold_expires_at: holdExpires,
    })
    .eq("id", bookingId)
    .eq("status", "requested")
    .select("id");

  // 23P01 = exclusion_violation: datoene ble låst av en annen booking imens.
  if (error || !updated || updated.length === 0) {
    return { ok: false, reason: "conflict" };
  }

  if (booking.guest_email) {
    await sendBookingApproved({
      to: booking.guest_email,
      guestName: booking.guest_name,
      propertyName: property?.name ?? "",
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      depositAmount: deposit,
      fullUpfront,
      payToken: booking.guest_token,
    });
  }
  return { ok: true };
}

/** Kjernelogikk for å avslå en forespørsel. Datoene var aldri låst. */
export async function rejectRequest(bookingId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id,status,guest_email,guest_name,check_in,check_out,property_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking || booking.status !== "requested") return false;

  await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", "requested");

  if (booking.guest_email) {
    const { data: property } = await supabase
      .from("properties")
      .select("name")
      .eq("id", booking.property_id)
      .single();
    await sendBookingRejected({
      to: booking.guest_email,
      guestName: booking.guest_name,
      propertyName: property?.name ?? "",
      checkIn: booking.check_in,
      checkOut: booking.check_out,
    });
  }
  return true;
}

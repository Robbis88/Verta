"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ownerBookingSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { cancelAndRefund } from "@/lib/booking";
import { sendBookingApproved, sendBookingRejected } from "@/lib/email";
import { calculateBookingTotal } from "@/lib/pricing";
import { hoursToRemainingDeadline } from "@/lib/cancellation";

export type OwnerBookingState = {
  error?: string;
  ok?: boolean;
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

/** Utleier registrerer en booking manuelt (f.eks. fra Airbnb/Booking). */
export async function createOwnerBooking(
  propertyId: string,
  _prev: OwnerBookingState,
  formData: FormData,
): Promise<OwnerBookingState> {
  const user = await requireUser();

  const parsed = ownerBookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // RLS (owns_property) sikrer at eiendommen tilhører brukeren.
  const supabase = await createClient();

  // Oppgitt pris vinner; ellers beregn fra eiendommens lagrede priser.
  const total_price = data.total_price
    ? data.total_price
    : await calculateBookingTotal(propertyId, data.check_in, data.check_out);

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      property_id: propertyId,
      guest_name: data.guest_name,
      guest_email: data.guest_email || null,
      check_in: data.check_in,
      check_out: data.check_out,
      nights: nightsBetween(data.check_in, data.check_out),
      total_price,
      source: data.source,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit({
    user_id: user.id,
    action: "booking.created",
    resource_type: "booking",
    resource_id: booking.id,
    changes: { source: data.source },
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { ok: true };
}

export async function cancelBooking(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  // Tilgangskontroll via RLS: select returnerer kun raden hvis brukeren eier den.
  const { data: owned } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!owned) return;

  // Eier-kansellering → alltid full refusjon til gjesten (ikke gjestens skyld).
  // Håndterer smartlås-kode, Stripe-refusjon og varsler til gjest + eier.
  await cancelAndRefund({ bookingId: id, refundFraction: 1 });

  await logAudit({
    user_id: user.id,
    action: "booking.cancelled",
    resource_type: "booking",
    resource_id: id,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

/**
 * Eier godkjenner en forespørsel: låser datoene, setter 50 % depositum og en
 * 24t-frist, og sender gjesten en betalingslenke. Krever at eier har koblet
 * utbetaling (Connect), ellers kan vi ikke kreve depositum.
 */
export async function approveBooking(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  // RLS sikrer eierskap; må være en åpen forespørsel.
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id,status,amount_total,guest_email,guest_name,check_in,check_out,guest_token,property_id",
    )
    .eq("id", id)
    .maybeSingle();
  if (!booking || booking.status !== "requested") return;

  const profile = await getCurrentProfile();
  if (!profile?.payouts_enabled) {
    redirect(`/dashboard/settings?utbetaling=mangler`);
  }

  const total = Number(booking.amount_total ?? 0);
  // Er innsjekk nærmere enn restfristen (7 dager)? Da er 50/50-splitten umulig
  // — restfristen ligger alt bak oss. Krev full betaling med en gang, så
  // unngår vi en «rest» som aldri kan betales og som ville auto-avbestilt.
  const fullUpfront = hoursToRemainingDeadline(booking.check_in) <= 0;
  const deposit = fullUpfront
    ? total
    : Math.round(total * 0.5 * 100) / 100;
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
    .eq("id", id)
    .eq("status", "requested")
    .select("id");

  // 23P01 = exclusion_violation: datoene ble låst av en annen booking i mellomtiden.
  if (error || !updated || updated.length === 0) {
    redirect(`/dashboard/properties/${propertyId}?godkjenn=konflikt`);
  }

  if (booking.guest_email) {
    const { data: property } = await supabase
      .from("properties")
      .select("name")
      .eq("id", booking.property_id)
      .single();
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

  await logAudit({
    user_id: user.id,
    action: "booking.approved",
    resource_type: "booking",
    resource_id: id,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

/** Eier avslår en forespørsel. Datoene var aldri låst, så ingenting frigis. */
export async function rejectBooking(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id,status,guest_email,guest_name,check_in,check_out,property_id")
    .eq("id", id)
    .maybeSingle();
  if (!booking || booking.status !== "requested") return;

  await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id)
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

  await logAudit({
    user_id: user.id,
    action: "booking.rejected",
    resource_type: "booking",
    resource_id: id,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

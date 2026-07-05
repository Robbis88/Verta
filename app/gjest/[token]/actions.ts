"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { cancelAndRefund } from "@/lib/booking";
import { refundFractionForCheckIn } from "@/lib/cancellation";

export type GuestCancelResult = { ok: boolean; message: string };

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

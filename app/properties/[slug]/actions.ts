"use server";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { bookingSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import {
  sendBookingConfirmation,
  sendOwnerBookingNotification,
} from "@/lib/email";
import { provisionBookingAccess } from "@/lib/access";
import { calculateBookingTotal, quoteBookingTotal, type Quote } from "@/lib/pricing";
import { loggHendelse } from "@/lib/kontrollrom";

export type BookingFormState = {
  error?: string;
  success?: boolean;
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

/**
 * Oppretter en direkte booking fra den offentlige booking-siden.
 * Gjesten er ikke innlogget, så vi bruker admin-klienten (omgår RLS).
 */
export async function createDirectBooking(
  slug: string,
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const supabase = createAdminClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id,user_id,name,access_info")
    .eq("slug", slug)
    .single();

  if (!property) return { error: "Fant ikke eiendommen" };

  // Overlapp-sjekk: finnes en aktiv booking som krysser datointervallet?
  const { data: clashes } = await supabase
    .from("bookings")
    .select("id")
    .eq("property_id", property.id)
    .neq("status", "cancelled")
    .lt("check_in", data.check_out)
    .gt("check_out", data.check_in);

  if (clashes && clashes.length > 0) {
    return { error: "Disse datoene er dessverre opptatt. Velg andre datoer." };
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
      nights: nightsBetween(data.check_in, data.check_out),
      total_price: await calculateBookingTotal(
        property.id,
        data.check_in,
        data.check_out,
      ),
      source: "verta_direct",
      status: "confirmed",
    })
    .select("id,guest_token")
    .single();

  if (error) return { error: error.message };

  await logAudit({
    user_id: property.user_id,
    action: "booking.created",
    resource_type: "booking",
    resource_id: booking.id,
    changes: { source: "verta_direct" },
  });

  await loggHendelse({
    type: "system",
    alvorlighet: "info",
    tittel: `Ny booking · ${property.name}`,
    detaljer: {
      gjest: data.guest_name,
      innsjekk: data.check_in,
      utsjekk: data.check_out,
      kilde: "verta_direct",
    },
    bruker_ref: data.guest_name,
  });

  // Skaff tilkomst: smartlås-kode (auto) eller eierens nøkkelboks-info.
  const access = await provisionBookingAccess({
    propertyId: property.id,
    checkIn: data.check_in,
    checkOut: data.check_out,
    label: `Verta · ${data.guest_name}`,
    accessInfo: property.access_info,
  });

  // Lagre en evt. smartlås-kode på bookingen (for visning + tilbaketrekking).
  if (access?.type === "smartlock") {
    await supabase
      .from("bookings")
      .update({ access_code: access.code, access_code_id: access.accessCodeId })
      .eq("id", booking.id);
  }

  // Send bekreftelse (gjest) + varsel (eier). Feiler aldri bookingen.
  const nights = nightsBetween(data.check_in, data.check_out);
  const { data: owner } = await supabase
    .from("users")
    .select("email")
    .eq("id", property.user_id)
    .single();

  await Promise.allSettled([
    data.guest_email
      ? sendBookingConfirmation({
          to: data.guest_email,
          guestName: data.guest_name,
          propertyName: property.name,
          checkIn: data.check_in,
          checkOut: data.check_out,
          nights,
          access,
          guideToken: booking.guest_token,
        })
      : Promise.resolve(false),
    owner?.email
      ? sendOwnerBookingNotification({
          to: owner.email,
          propertyName: property.name,
          guestName: data.guest_name,
          guestEmail: data.guest_email || null,
          checkIn: data.check_in,
          checkOut: data.check_out,
        })
      : Promise.resolve(false),
  ]);

  return { success: true };
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

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ownerBookingSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

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
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      property_id: propertyId,
      guest_name: data.guest_name,
      guest_email: data.guest_email || null,
      check_in: data.check_in,
      check_out: data.check_out,
      nights: nightsBetween(data.check_in, data.check_out),
      total_price: data.total_price ? data.total_price : null,
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
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return;

  await logAudit({
    user_id: user.id,
    action: "booking.cancelled",
    resource_type: "booking",
    resource_id: id,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendIncidentClaim } from "@/lib/email";

const BUCKET = "incident-photos";

/** Signert opplasting for et skadebilde (direkte fra nettleseren til Storage). */
export async function createClaimPhotoUpload(
  bookingId: string,
  contentType: string,
): Promise<{ path: string; token: string; publicUrl: string } | null> {
  await requireUser();
  const supabase = await createClient();
  // Eierskap via RLS: klarer vi å lese bookingen, eier vi den.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id,property_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return null;

  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";
  const path = `${booking.property_id}/${bookingId}/${crypto.randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) return null;
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  return { path, token: data.token, publicUrl: pub.publicUrl };
}

/** Oppretter et skadekrav og sender gjesten kravet på e-post. */
export async function createIncidentClaim(formData: FormData): Promise<void> {
  await requireUser();
  const bookingId = String(formData.get("booking_id") ?? "");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim() || null;
  const photos = formData.getAll("photos").map(String).filter(Boolean);
  if (!bookingId || !Number.isFinite(amount) || amount <= 0) return;

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id,property_id,guest_name,guest_email")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return; // RLS: ikke egen booking

  const { data: claim, error } = await supabase
    .from("incident_claims")
    .insert({
      booking_id: bookingId,
      property_id: booking.property_id,
      amount,
      description,
      photos,
      status: "pending",
    })
    .select("claim_token")
    .single();
  if (error || !claim) return;

  if (booking.guest_email) {
    const { data: property } = await supabase
      .from("properties")
      .select("name")
      .eq("id", booking.property_id)
      .single();
    await sendIncidentClaim({
      to: booking.guest_email,
      guestName: booking.guest_name,
      propertyName: property?.name ?? "",
      amount,
      description,
      photoUrls: photos,
      claimToken: claim.claim_token,
    });
  }

  redirect(`/dashboard/properties/${booking.property_id}?krav=sendt`);
}

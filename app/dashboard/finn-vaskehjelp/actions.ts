"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function requestCleaner(formData: FormData): Promise<void> {
  const user = await requireUser();
  const cleanerId = String(formData.get("cleaner_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  if (!cleanerId || !propertyId) return;
  const jobDate = String(formData.get("job_date") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const supabase = await createClient();
  // RLS sikrer at brukeren eier eiendommen i forespørselen.
  const { error } = await supabase.from("service_requests").insert({
    cleaner_id: cleanerId,
    property_id: propertyId,
    requester_user_id: user.id,
    job_date: jobDate || null,
    message: message || null,
    status: "pending",
  });
  if (error) return;

  await logAudit({
    user_id: user.id,
    action: "service_request.sent",
    resource_type: "cleaner",
    resource_id: cleanerId,
  });
  revalidatePath("/dashboard/finn-vaskehjelp");
}

/** Eier som har hatt et godtatt oppdrag gir vaskeren en vurdering (1–5). */
export async function reviewCleaner(formData: FormData): Promise<void> {
  const user = await requireUser();
  const cleanerId = String(formData.get("cleaner_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  if (!cleanerId || rating < 1 || rating > 5) return;
  const comment = String(formData.get("comment") ?? "").trim();
  const propertyId = String(formData.get("property_id") ?? "");

  const supabase = await createClient();
  // Krev at det finnes et godtatt oppdrag med denne vaskeren.
  const { data: accepted } = await supabase
    .from("service_requests")
    .select("id")
    .eq("cleaner_id", cleanerId)
    .eq("requester_user_id", user.id)
    .eq("status", "accepted")
    .limit(1);
  if (!accepted || accepted.length === 0) return;

  await supabase.from("cleaner_reviews").upsert(
    {
      cleaner_id: cleanerId,
      reviewer_user_id: user.id,
      property_id: propertyId || null,
      rating,
      comment: comment || null,
    },
    { onConflict: "cleaner_id,reviewer_user_id" },
  );
  revalidatePath("/dashboard/finn-vaskehjelp");
}

export async function cancelRequest(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("service_requests")
    .update({ status: "cancelled" })
    .eq("id", id);
  revalidatePath("/dashboard/finn-vaskehjelp");
}

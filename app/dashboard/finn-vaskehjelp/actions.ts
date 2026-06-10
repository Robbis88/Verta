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

"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Håndverkeren oppdaterer status på en sak hen er tildelt, via portal-token
 * (ingen innlogging). Tokenet er tilgangsnøkkelen; vi verifiserer at saken
 * tilhører håndverkeren med dette tokenet før vi oppdaterer.
 * Kostnad/utgift styres av eieren — håndverkeren melder kun framdrift.
 */
export async function updateRequestByContractor(
  formData: FormData,
): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!token || !requestId) return;
  if (!["in_progress", "resolved"].includes(status)) return;

  const supabase = createAdminClient();
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();
  if (!contractor) return;

  await supabase
    .from("maintenance_requests")
    .update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", requestId)
    .eq("contractor_id", contractor.id);

  revalidatePath(`/handverker/${token}`);
}

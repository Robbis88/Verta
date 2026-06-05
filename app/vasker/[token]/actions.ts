"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vaskeren oppdaterer status på egen oppgave via portal-token (ingen innlogging).
 * Tokenet fungerer som tilgangsnøkkel; vi verifiserer at oppgaven tilhører
 * vaskeren med dette tokenet før vi oppdaterer.
 */
export async function updateTaskByCleaner(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const taskId = String(formData.get("task_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!token || !taskId) return;
  if (!["in_progress", "completed"].includes(status)) return;

  const supabase = createAdminClient();
  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleaner) return;

  await supabase
    .from("cleaning_tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("cleaner_id", cleaner.id);

  revalidatePath(`/vasker/${token}`);
}

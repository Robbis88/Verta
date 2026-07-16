"use server";

import { revalidatePath } from "next/cache";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Kvitterer bort et kritisk varsel. Eier kan kvittere alarmer på egne
 * eiendommer (RLS). Admin kan kvittere alt (også plattform-nivå) via service-role.
 */
export async function resolveAlert(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const profile = await getCurrentProfile();
  if (isAdmin(profile?.email)) {
    const admin = createAdminClient();
    await admin.from("critical_alerts").update({ resolved: true }).eq("id", id);
  } else {
    // RLS-update-policy tillater kun alarmer på egne eiendommer.
    const supabase = await createClient();
    await supabase
      .from("critical_alerts")
      .update({ resolved: true })
      .eq("id", id);
  }

  revalidatePath("/dashboard");
}

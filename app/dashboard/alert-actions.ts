"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  // redirect tvinger en fersk render — revalidatePath alene oppdaterer ikke
  // router-cachen for den siden vi allerede står på.
  redirect("/dashboard");
}

/**
 * Markerer at gjestelenken er sendt til gjesten, så påminnelsen på dashbordet
 * forsvinner. RLS scoper til eierens egne bookinger.
 */
export async function markGuestLinkSent(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("bookings")
    .update({
      guest_link_sent: true,
      guest_link_sent_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

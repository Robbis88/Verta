"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!isAdmin(user?.email)) return null;
  return user;
}

/** Kobler til (manuelt for nå) en Verta-kanal. */
export async function connectChannel(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!user) return;
  const platform = String(formData.get("platform") ?? "");
  const handle = String(formData.get("handle") ?? "").trim();
  if (!platform) return;

  const supabase = createAdminClient();
  await supabase
    .from("social_accounts")
    .upsert(
      { platform, handle: handle || null, status: "connected", updated_at: new Date().toISOString() },
      { onConflict: "platform" },
    );
  await logAudit({
    user_id: user.id,
    action: "channel.connected",
    resource_type: "social_account",
    resource_id: platform,
    severity: "security",
  });
  revalidatePath("/admin/kanaler");
}

export async function disconnectChannel(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!user) return;
  const platform = String(formData.get("platform") ?? "");
  if (!platform) return;
  const supabase = createAdminClient();
  await supabase.from("social_accounts").delete().eq("platform", platform);
  revalidatePath("/admin/kanaler");
}

/** Marker en boost som publisert (manuell publisering) + lagre lenke. */
export async function markBoostPublished(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!user) return;
  const id = String(formData.get("boost_id") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  if (!id) return;
  const supabase = createAdminClient();
  await supabase
    .from("boosts")
    .update({
      published_at: new Date().toISOString(),
      published_url: url || null,
      status: "active",
    })
    .eq("id", id);
  revalidatePath("/admin/kanaler");
}

"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function addCoHost(formData: FormData): Promise<void> {
  const user = await requireUser();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return;

  const supabase = await createClient();
  await supabase
    .from("team_members")
    .upsert(
      { owner_user_id: user.id, member_email: email, role: "co_host" },
      { onConflict: "owner_user_id,member_email" },
    );

  await logAudit({
    user_id: user.id,
    action: "team.cohost.invited",
    resource_type: "user",
    resource_id: user.id,
    changes: { email },
    severity: "security",
  });
  revalidatePath("/dashboard/team");
}

export async function removeCoHost(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("team_members").delete().eq("id", id);
  await logAudit({
    user_id: user.id,
    action: "team.cohost.removed",
    resource_type: "team_member",
    resource_id: id,
    severity: "security",
  });
  revalidatePath("/dashboard/team");
}

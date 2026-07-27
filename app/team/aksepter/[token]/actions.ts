"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

/**
 * Aksepterer en co-host-invitasjon. Verifiserer at innlogget bruker sin e-post
 * matcher invitasjonen før medlemskapet kobles (hindrer token-deling).
 */
export async function acceptInvite(formData: FormData): Promise<void> {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "");
  if (!token) return;

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("team_members")
    .select("id,member_email,owner_user_id")
    .eq("invite_token", token)
    .maybeSingle();
  if (!invite) return;

  const userEmail = (user.email ?? "").trim().toLowerCase();
  if (userEmail !== invite.member_email.trim().toLowerCase()) {
    return; // E-post matcher ikke invitasjonen — gjør ingenting.
  }

  await admin
    .from("team_members")
    .update({ member_user_id: user.id, accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  await logAudit({
    user_id: invite.owner_user_id,
    action: "team.cohost.accepted",
    resource_type: "team_member",
    resource_id: invite.id,
    changes: { member: userEmail },
    severity: "security",
  });

  redirect("/hjem");
}

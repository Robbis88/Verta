"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

/** Lagrer cookie-samtykke i en cookie og (om innlogget) i cookie_consents. */
export async function saveConsent(
  analytics: boolean,
  marketing: boolean,
): Promise<void> {
  const store = await cookies();
  store.set("verta_consent", JSON.stringify({ analytics, marketing }), {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("cookie_consents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("cookie_consents")
      .update({ analytics, marketing })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("cookie_consents")
      .insert({ user_id: user.id, analytics, marketing });
  }
}

/** Sletter brukerkontoen og alle tilhørende data (cascade), og logger ut. */
export async function deleteAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await logAudit({
    user_id: user.id,
    action: "account.deleted",
    resource_type: "user",
    resource_id: user.id,
    severity: "security",
  });

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(user.id); // cascade sletter alt
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}

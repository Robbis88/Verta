"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendGuideMessage } from "@/lib/email";

/** Gjesten sender en melding til utleieren fra guiden (eskalering). */
export async function contactHost(
  token: string,
  formData: FormData,
): Promise<void> {
  const message = String(formData.get("message") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim() || null;
  if (!message) redirect(`/guide/${token}`);

  const supabase = createAdminClient();
  const { data: p } = await supabase
    .from("properties")
    .select("name,user_id")
    .eq("guide_token", token)
    .maybeSingle();
  if (!p) redirect(`/guide/${token}`);

  const { data: owner } = await supabase
    .from("users")
    .select("email")
    .eq("id", p!.user_id)
    .single();
  if (owner?.email) {
    await sendGuideMessage({
      to: owner.email,
      propertyName: p!.name,
      message,
      guestContact: contact,
    });
  }
  redirect(`/guide/${token}?sendt=1`);
}

"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { suggestGuestReply, suggestReviewReply } from "@/lib/ai";
import { logAudit } from "@/lib/audit";

export type ReplyState = { reply?: string; error?: string };

/** Foreslår svar på en gjestemelding ut fra eiendommens fakta. */
export async function draftGuestReply(
  _prev: ReplyState,
  formData: FormData,
): Promise<ReplyState> {
  await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  const guestMessage = String(formData.get("guest_message") ?? "").trim();
  if (!propertyId) return { error: "Velg en eiendom" };
  if (!guestMessage) return { error: "Lim inn gjestens melding" };

  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("name,address,wifi_name,house_rules,checkout_info,access_info")
    .eq("id", propertyId)
    .single();
  if (!property) return { error: "Fant ikke eiendommen" };

  try {
    const reply = await suggestGuestReply({
      property: {
        name: property.name,
        address: property.address,
        wifiName: property.wifi_name,
        houseRules: property.house_rules,
        checkoutInfo: property.checkout_info,
        accessInfo: property.access_info,
      },
      guestMessage,
    });
    return { reply: reply || "(Modellen ga ikke noe svar — prøv igjen.)" };
  } catch {
    return { error: "Kunne ikke generere svar akkurat nå. Prøv igjen." };
  }
}

/** Foreslår svar på en anmeldelse. */
export async function draftReviewReply(
  _prev: ReplyState,
  formData: FormData,
): Promise<ReplyState> {
  await requireUser();
  const review = String(formData.get("review") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);
  const propertyId = String(formData.get("property_id") ?? "");
  if (!review) return { error: "Lim inn anmeldelsen" };

  const supabase = await createClient();
  let propertyName: string | null = null;
  if (propertyId) {
    const { data } = await supabase
      .from("properties")
      .select("name")
      .eq("id", propertyId)
      .single();
    propertyName = data?.name ?? null;
  }

  try {
    const reply = await suggestReviewReply({ propertyName, rating, review });
    return { reply: reply || "(Modellen ga ikke noe svar — prøv igjen.)" };
  } catch {
    return { error: "Kunne ikke generere svar akkurat nå. Prøv igjen." };
  }
}

/** Logger en gjestemelding + (valgfritt) vårt svar i meldingsloggen. */
export async function logConversation(formData: FormData): Promise<void> {
  const user = await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  const channel = String(formData.get("channel") ?? "other");
  const incoming = String(formData.get("incoming") ?? "").trim();
  const outgoing = String(formData.get("outgoing") ?? "").trim();
  if (!propertyId) return;

  const supabase = await createClient();
  const rows = [
    incoming
      ? { property_id: propertyId, direction: "incoming", channel, body: incoming }
      : null,
    outgoing
      ? { property_id: propertyId, direction: "outgoing", channel, body: outgoing }
      : null,
  ].filter(Boolean) as {
    property_id: string;
    direction: string;
    channel: string;
    body: string;
  }[];
  if (rows.length === 0) return;

  await supabase.from("messages").insert(rows);
  await logAudit({
    user_id: user.id,
    action: "message.logged",
    resource_type: "property",
    resource_id: propertyId,
  });
  revalidatePath("/dashboard/meldinger");
}

export async function deleteMessage(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("messages").delete().eq("id", id);
  revalidatePath("/dashboard/meldinger");
}

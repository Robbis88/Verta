"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { boostSchema } from "@/lib/validation";
import { generateBoostCopy } from "@/lib/ai";
import { logAudit } from "@/lib/audit";
import { vippsEnabled, createVippsPayment } from "@/lib/vipps";

export type BoostFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

async function copyForProperty(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propertyId: string,
  platform: string,
): Promise<string> {
  const { data: property } = await supabase
    .from("properties")
    .select("name,description,address,max_guests")
    .eq("id", propertyId)
    .single();
  if (!property) return "";
  try {
    return await generateBoostCopy({
      name: property.name,
      description: property.description,
      address: property.address,
      maxGuests: property.max_guests,
      platform,
    });
  } catch (err) {
    console.error("AI copy failed:", err);
    return "";
  }
}

export async function createBoost(
  _prev: BoostFormState,
  formData: FormData,
): Promise<BoostFormState> {
  const user = await requireUser();

  const parsed = boostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;
  const supabase = await createClient();

  // RLS (owns_property) sikrer at eiendommen tilhører brukeren.
  const { data: boost, error } = await supabase
    .from("boosts")
    .insert({
      property_id: data.property_id,
      budget_nok: data.budget_nok,
      platform: data.platform,
      start_date: data.start_date,
      end_date: data.end_date,
      status: "pending",
      utm_campaign_id: `boost_${crypto.randomUUID()}`,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Generer AI-annonsetekst og lagre den.
  const copy = await copyForProperty(supabase, data.property_id, data.platform);
  if (copy) {
    await supabase.from("boosts").update({ ai_generated_text: copy }).eq("id", boost.id);
  }

  await logAudit({
    user_id: user.id,
    action: "boost.created",
    resource_type: "boost",
    resource_id: boost.id,
  });

  revalidatePath("/dashboard/boosts");
  redirect(`/dashboard/boosts/${boost.id}`);
}

export async function regenerateBoostCopy(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: boost } = await supabase
    .from("boosts")
    .select("id,property_id,platform")
    .eq("id", id)
    .single();
  if (!boost) return;

  const copy = await copyForProperty(supabase, boost.property_id, boost.platform);
  if (copy) {
    await supabase.from("boosts").update({ ai_generated_text: copy }).eq("id", id);
  }
  revalidatePath(`/dashboard/boosts/${id}`);
}

export async function saveBoostText(
  _prev: BoostFormState,
  formData: FormData,
): Promise<BoostFormState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const text = String(formData.get("text") ?? "");
  if (!id) return { error: "Mangler boost-id" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("boosts")
    .update({ user_approved_text: text })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/boosts/${id}`);
  return {};
}

export async function payBoost(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  if (vippsEnabled) {
    // Ekte Vipps ePayment: opprett betaling og send brukeren til Vipps.
    const { data: boost } = await supabase
      .from("boosts")
      .select("budget_nok")
      .eq("id", id)
      .single();
    const origin =
      (await headers()).get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";
    const url = await createVippsPayment({
      amountNok: Number(boost?.budget_nok) || 0,
      reference: `boost-${id}`,
      returnUrl: `${origin}/api/vipps/return?boost=${id}`,
      description: "Verta boost",
    });
    redirect(url);
  }

  // Dev-fallback: marker som godkjent uten betaling.
  const { error } = await supabase
    .from("boosts")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return;

  await logAudit({
    user_id: user.id,
    action: "boost.approved.dev",
    resource_type: "boost",
    resource_id: id,
  });

  revalidatePath(`/dashboard/boosts/${id}`);
  redirect(`/dashboard/boosts/${id}?paid=1`);
}

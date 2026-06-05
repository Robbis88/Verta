"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { scanForUser } from "@/lib/alerts";
import { generateAlertCampaign } from "@/lib/ai";

export async function runScan(): Promise<void> {
  await requireUser();
  await scanForUser();
  revalidatePath("/dashboard/varsler");
}

export type CampaignState = { campaign?: string; error?: string };

/** Lager AI-kampanjemateriale for et varsel. */
export async function generateCampaign(
  _prev: CampaignState,
  formData: FormData,
): Promise<CampaignState> {
  await requireUser();
  const alertId = String(formData.get("alert_id") ?? "");
  if (!alertId) return { error: "Mangler varsel" };

  const supabase = await createClient();
  const { data: alert } = await supabase
    .from("empty_date_alerts")
    .select("gap_start,gap_end,occupancy_pct,property_id")
    .eq("id", alertId)
    .single();
  if (!alert) return { error: "Fant ikke varselet" };

  const { data: property } = await supabase
    .from("properties")
    .select("name,address")
    .eq("id", alert.property_id)
    .single();
  if (!property) return { error: "Fant ikke eiendommen" };

  try {
    const campaign = await generateAlertCampaign({
      propertyName: property.name,
      address: property.address,
      gapStart: alert.gap_start,
      gapEnd: alert.gap_end,
      occupancyPct: alert.occupancy_pct,
    });
    return { campaign: campaign || "(Modellen ga ikke noe svar — prøv igjen.)" };
  } catch {
    return { error: "Kunne ikke generere kampanje akkurat nå. Prøv igjen." };
  }
}

async function setStatus(id: string, status: "dismissed" | "resolved") {
  await requireUser();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("empty_date_alerts").update({ status }).eq("id", id);
  revalidatePath("/dashboard/varsler");
}

export async function dismissAlert(formData: FormData): Promise<void> {
  await setStatus(String(formData.get("id") ?? ""), "dismissed");
}

export async function resolveAlert(formData: FormData): Promise<void> {
  await setStatus(String(formData.get("id") ?? ""), "resolved");
}

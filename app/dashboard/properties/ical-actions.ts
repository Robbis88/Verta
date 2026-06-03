"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { importIcalForProperty } from "@/lib/ical-import";
import { logAudit } from "@/lib/audit";
import type { IcalUrl } from "@/lib/types";

export async function addIcalUrl(formData: FormData): Promise<void> {
  const user = await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const source = String(formData.get("source") ?? "airbnb") === "booking"
    ? "booking"
    : "airbnb";
  if (!propertyId || !url) return;

  const supabase = await createClient();
  const { data: prop } = await supabase
    .from("properties")
    .select("ical_urls")
    .eq("id", propertyId)
    .single();
  const urls = ((prop?.ical_urls ?? []) as IcalUrl[]).filter((u) => u.url !== url);
  urls.push({ url, source });

  await supabase
    .from("properties")
    .update({ ical_urls: urls })
    .eq("id", propertyId);
  await logAudit({
    user_id: user.id,
    action: "ical.url.added",
    resource_type: "property",
    resource_id: propertyId,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function removeIcalUrl(formData: FormData): Promise<void> {
  await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  const url = String(formData.get("url") ?? "");
  if (!propertyId || !url) return;

  const supabase = await createClient();
  const { data: prop } = await supabase
    .from("properties")
    .select("ical_urls")
    .eq("id", propertyId)
    .single();
  const urls = ((prop?.ical_urls ?? []) as IcalUrl[]).filter((u) => u.url !== url);

  await supabase
    .from("properties")
    .update({ ical_urls: urls })
    .eq("id", propertyId);
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function syncIcal(formData: FormData): Promise<void> {
  const user = await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  if (!propertyId) return;

  const result = await importIcalForProperty(propertyId);
  await logAudit({
    user_id: user.id,
    action: "ical.synced",
    resource_type: "property",
    resource_id: propertyId,
    changes: result,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

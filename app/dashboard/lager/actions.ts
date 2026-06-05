"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addSupply(formData: FormData): Promise<void> {
  await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!propertyId || !name) return;

  const supabase = await createClient();
  await supabase.from("supplies").insert({
    property_id: propertyId,
    name,
    current_qty: Number(formData.get("current_qty") ?? 0) || 0,
    low_threshold: Number(formData.get("low_threshold") ?? 1) || 1,
    unit: String(formData.get("unit") ?? "").trim() || null,
  });
  revalidatePath("/dashboard/lager");
}

/** Justerer beholdning med +/- (klamper til 0). */
export async function adjustSupply(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  if (!id || !delta) return;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("supplies")
    .select("current_qty")
    .eq("id", id)
    .single();
  if (!row) return;
  const next = Math.max(0, Number(row.current_qty) + delta);
  await supabase.from("supplies").update({ current_qty: next }).eq("id", id);
  revalidatePath("/dashboard/lager");
}

/** Fyller opp til måltall (2× terskel). */
export async function refillSupply(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("supplies")
    .select("low_threshold")
    .eq("id", id)
    .single();
  if (!row) return;
  await supabase
    .from("supplies")
    .update({ current_qty: Math.max(1, Number(row.low_threshold) * 2) })
    .eq("id", id);
  revalidatePath("/dashboard/lager");
}

export async function deleteSupply(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("supplies").delete().eq("id", id);
  revalidatePath("/dashboard/lager");
}

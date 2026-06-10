"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeNorway } from "@/lib/geocode";

/**
 * Vaskeren oppdaterer sin egen profil: tilgjengelig for andre oppdrag, hvor
 * langt hun kjører, timepris og hjemmeadresse (geokodes for avstandsmatch).
 */
export async function updateCleanerProfile(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  if (!token) return;

  const available = formData.get("available_for_hire") === "on";
  const maxKmRaw = String(formData.get("max_travel_km") ?? "").trim();
  const rateRaw = String(formData.get("hourly_rate") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const baseAddress = String(formData.get("base_address") ?? "").trim();

  const supabase = createAdminClient();
  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleaner) return;

  const coords = baseAddress ? await geocodeNorway(baseAddress) : null;

  await supabase
    .from("cleaners")
    .update({
      available_for_hire: available,
      max_travel_km: maxKmRaw ? Number(maxKmRaw) : null,
      hourly_rate: rateRaw ? Number(rateRaw) : null,
      bio: bio || null,
      base_address: baseAddress || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .eq("id", cleaner.id);

  revalidatePath(`/vasker/${token}`);
}

/**
 * Vaskeren oppdaterer status på egen oppgave via portal-token (ingen innlogging).
 * Tokenet fungerer som tilgangsnøkkel; vi verifiserer at oppgaven tilhører
 * vaskeren med dette tokenet før vi oppdaterer.
 */
export async function updateTaskByCleaner(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const taskId = String(formData.get("task_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!token || !taskId) return;
  if (!["in_progress", "completed"].includes(status)) return;

  const supabase = createAdminClient();
  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleaner) return;

  await supabase
    .from("cleaning_tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("cleaner_id", cleaner.id);

  revalidatePath(`/vasker/${token}`);
}

/** Vaskeren godtar eller avslår en forespørsel. Ved godtatt lages en oppgave. */
export async function respondToRequest(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const requestId = String(formData.get("request_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!token || !requestId) return;
  if (!["accepted", "declined"].includes(decision)) return;

  const supabase = createAdminClient();
  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleaner) return;

  const { data: req } = await supabase
    .from("service_requests")
    .select("id,property_id,job_date,status")
    .eq("id", requestId)
    .eq("cleaner_id", cleaner.id)
    .maybeSingle();
  if (!req || req.status !== "pending") return;

  await supabase
    .from("service_requests")
    .update({ status: decision, responded_at: new Date().toISOString() })
    .eq("id", req.id);

  // Godtatt + dato → opprett en rengjøringsoppgave tildelt vaskeren.
  if (decision === "accepted" && req.job_date) {
    await supabase.from("cleaning_tasks").insert({
      property_id: req.property_id,
      cleaner_id: cleaner.id,
      task_date: req.job_date,
      type: "turnover",
      status: "assigned",
    });
  }

  revalidatePath(`/vasker/${token}`);
}

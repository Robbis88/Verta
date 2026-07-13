"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeNorway } from "@/lib/geocode";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { CLEANING_PHOTOS_BUCKET } from "@/lib/storage";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Starter (eller gjenopptar) Stripe Connect-onboarding for vaskeren, så hen kan
 * få betalt sporbart gjennom Verta. Feiler noe, vises en pen melding i stedet
 * for at portalen krasjer.
 */
export async function startCleanerConnect(token: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id,email,stripe_connect_id")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleaner) redirect(`/vasker/${token}`);
  if (!stripe || !stripeEnabled) redirect(`/vasker/${token}?utbetaling=av`);

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let url: string;
  try {
    let connectId = cleaner!.stripe_connect_id ?? null;
    if (!connectId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "NO",
        email: cleaner!.email ?? undefined,
        capabilities: { transfers: { requested: true } },
        metadata: { cleaner_id: cleaner!.id },
      });
      connectId = account.id;
      await supabase
        .from("cleaners")
        .update({ stripe_connect_id: connectId })
        .eq("id", cleaner!.id);
    }
    const link = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: `${origin}/api/stripe/connect/cleaner/refresh?token=${token}`,
      return_url: `${origin}/api/stripe/connect/cleaner/return?token=${token}`,
      type: "account_onboarding",
    });
    url = link.url;
  } catch (err) {
    console.error("Vasker Connect-onboarding feilet:", err);
    redirect(`/vasker/${token}?utbetaling=feil`);
  }
  redirect(url);
}

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

function parseCoord(value: FormDataEntryValue | null): number | null {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) && n !== 0 ? n : null;
}

/**
 * Vaskeren stempler inn på en oppgave med tidspunkt + posisjon (GPS valgfritt).
 * Setter også status til 'in_progress'. Token verifiserer tilgang.
 */
export async function clockInTask(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const taskId = String(formData.get("task_id") ?? "");
  if (!token || !taskId) return;

  const supabase = createAdminClient();
  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleaner) return;

  await supabase
    .from("cleaning_tasks")
    .update({
      status: "in_progress",
      clock_in_at: new Date().toISOString(),
      clock_in_lat: parseCoord(formData.get("lat")),
      clock_in_lng: parseCoord(formData.get("lng")),
    })
    .eq("id", taskId)
    .eq("cleaner_id", cleaner.id);

  revalidatePath(`/vasker/${token}`);
}

/**
 * Vaskeren stempler ut: tidspunkt + posisjon, og status settes til 'completed'.
 */
export async function clockOutTask(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const taskId = String(formData.get("task_id") ?? "");
  if (!token || !taskId) return;

  const supabase = createAdminClient();
  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleaner) return;

  await supabase
    .from("cleaning_tasks")
    .update({
      status: "completed",
      clock_out_at: new Date().toISOString(),
      clock_out_lat: parseCoord(formData.get("lat")),
      clock_out_lng: parseCoord(formData.get("lng")),
    })
    .eq("id", taskId)
    .eq("cleaner_id", cleaner.id);

  revalidatePath(`/vasker/${token}`);
}

/**
 * Vaskeren laster opp et før/etter-bilde for en oppgave hen er tildelt.
 * Token er tilgangsnøkkelen; bildet lagres i en privat bucket via service-role.
 */
export async function uploadCleaningPhoto(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const taskId = String(formData.get("task_id") ?? "");
  const kind = String(formData.get("kind") ?? "after");
  const file = formData.get("photo");
  if (!token || !taskId) return;
  if (!["before", "after"].includes(kind)) return;
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_PHOTO_BYTES) return;
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return;

  const supabase = createAdminClient();
  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleaner) return;

  // Verifiser at oppgaven tilhører denne vaskeren før vi lagrer noe.
  const { data: task } = await supabase
    .from("cleaning_tasks")
    .select("id,property_id")
    .eq("id", taskId)
    .eq("cleaner_id", cleaner.id)
    .maybeSingle();
  if (!task) return;

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${task.property_id}/${taskId}/${kind}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(CLEANING_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return;

  await supabase.from("cleaning_photos").insert({
    task_id: taskId,
    property_id: task.property_id,
    kind,
    storage_path: path,
  });

  revalidatePath(`/vasker/${token}`);
}

/** Vaskeren sletter et bilde hen har lastet opp. */
export async function deleteCleaningPhoto(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const photoId = String(formData.get("photo_id") ?? "");
  if (!token || !photoId) return;

  const supabase = createAdminClient();
  const { data: cleaner } = await supabase
    .from("cleaners")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();
  if (!cleaner) return;

  const { data: photo } = await supabase
    .from("cleaning_photos")
    .select("id,storage_path,task_id")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo) return;

  // Bildet må tilhøre en oppgave tildelt denne vaskeren.
  const { data: task } = await supabase
    .from("cleaning_tasks")
    .select("id")
    .eq("id", photo.task_id)
    .eq("cleaner_id", cleaner.id)
    .maybeSingle();
  if (!task) return;

  await supabase.storage.from(CLEANING_PHOTOS_BUCKET).remove([photo.storage_path]);
  await supabase.from("cleaning_photos").delete().eq("id", photo.id);

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

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const EIERSKAP = "/dashboard/okonomi/eierskap";
const HISTORIKK = "/dashboard/okonomi/historikk";
const EVENT_KINDS = ["kjop", "oppussing", "vedlikehold", "finans", "verdi"];

/** Legg til en medeier (RLS sikrer at brukeren eier eiendommen). */
export async function addOwner(formData: FormData): Promise<void> {
  await requireUser();
  const property_id = String(formData.get("property_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const share_pct = Number(formData.get("share_pct")) || 0;
  if (!property_id || !name) return;

  const supabase = await createClient();
  await supabase
    .from("property_owners")
    .insert({ property_id, name, share_pct });
  revalidatePath(EIERSKAP);
}

/** Fjern en medeier. */
export async function deleteOwner(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("property_owners").delete().eq("id", id);
  revalidatePath(EIERSKAP);
}

/** Registrer en innbetaling fra en medeier. */
export async function addContribution(formData: FormData): Promise<void> {
  await requireUser();
  const property_id = String(formData.get("property_id") ?? "");
  const owner_id = String(formData.get("owner_id") ?? "");
  const amount = Number(formData.get("amount")) || 0;
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!property_id || !owner_id || amount <= 0) return;

  const supabase = await createClient();
  await supabase
    .from("owner_contributions")
    .insert({ property_id, owner_id, amount, note });
  revalidatePath(EIERSKAP);
}

/** Legg til en hendelse i eiendommens tidslinje. */
export async function addEvent(formData: FormData): Promise<void> {
  await requireUser();
  const property_id = String(formData.get("property_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const event_date = String(formData.get("event_date") ?? "");
  const kindRaw = String(formData.get("kind") ?? "vedlikehold");
  const kind = EVENT_KINDS.includes(kindRaw) ? kindRaw : "vedlikehold";
  const amount = Number(formData.get("amount")) || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!property_id || !title || !event_date) return;

  const supabase = await createClient();
  await supabase
    .from("property_events")
    .insert({ property_id, title, event_date, kind, amount, note });
  revalidatePath(HISTORIKK);
}

/** Fjern en hendelse. */
export async function deleteEvent(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("property_events").delete().eq("id", id);
  revalidatePath(HISTORIKK);
}

/** Tom streng → null, ellers et ikke-negativt tall (null hvis ugyldig/for stort). */
function numOrNull(value: FormDataEntryValue | null, max: number): number | null {
  const raw = String(value ?? "")
    .trim()
    .replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return n;
}

/**
 * Oppdaterer eiendommens finansfelter (verdi, lån, rente, avdrag) direkte fra
 * Eiendomsøkonomi-siden. RLS sikrer at bare eieren kan skrive.
 */
export async function updateEconomy(formData: FormData): Promise<void> {
  await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  if (!propertyId) return;

  const supabase = await createClient();
  await supabase
    .from("properties")
    .update({
      market_value: numOrNull(formData.get("market_value"), 1_000_000_000),
      loan_amount: numOrNull(formData.get("loan_amount"), 1_000_000_000),
      interest_rate: numOrNull(formData.get("interest_rate"), 30),
      monthly_principal: numOrNull(formData.get("monthly_principal"), 1_000_000),
    })
    .eq("id", propertyId);

  revalidatePath("/dashboard/okonomi");
  redirect(`/dashboard/okonomi?eiendom=${propertyId}&lagret=1`);
}

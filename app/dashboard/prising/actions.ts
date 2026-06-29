"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { suggestPricing } from "@/lib/ai";
import { bookedDateSet } from "@/lib/availability";
import { seasonalRateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export type PricingState = { result?: string; error?: string };

export type SeasonalRateState = {
  error?: string;
  ok?: boolean;
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

const WINDOW = 90;

export async function generatePricing(
  _prev: PricingState,
  formData: FormData,
): Promise<PricingState> {
  await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  if (!propertyId) return { error: "Velg en eiendom" };
  const currentPriceRaw = String(formData.get("current_price") ?? "").trim();
  const currentPrice = currentPriceRaw ? Number(currentPriceRaw) : null;

  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("name,address,bedrooms,max_guests,base_nightly_rate")
    .eq("id", propertyId)
    .single();
  if (!property) return { error: "Fant ikke eiendommen" };

  // Bruk lagret basepris hvis brukeren ikke skrev inn en nåpris.
  const effectivePrice =
    currentPrice ??
    (property.base_nightly_rate != null
      ? Number(property.base_nightly_rate)
      : null);

  // Belegg de neste 90 dagene.
  const today = new Date();
  const from = today.toISOString().slice(0, 10);
  const toDate = new Date(today);
  toDate.setUTCDate(toDate.getUTCDate() + WINDOW);
  const to = toDate.toISOString().slice(0, 10);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("check_in,check_out,status")
    .eq("property_id", propertyId)
    .neq("status", "cancelled")
    .lt("check_in", to)
    .gte("check_out", from);
  const booked = bookedDateSet((bookings ?? []) as { check_in: string; check_out: string; status?: string }[]);

  let bookedInWindow = 0;
  const cur = new Date(`${from}T00:00:00Z`);
  for (let i = 0; i < WINDOW; i++) {
    const d = new Date(cur);
    d.setUTCDate(d.getUTCDate() + i);
    if (booked.has(d.toISOString().slice(0, 10))) bookedInWindow++;
  }
  const occupancyPct = Math.round((bookedInWindow / WINDOW) * 100);

  try {
    const result = await suggestPricing({
      propertyName: property.name,
      address: property.address,
      bedrooms: property.bedrooms,
      maxGuests: property.max_guests,
      occupancyPct,
      currentPrice: effectivePrice,
    });
    return { result: result || "(Modellen ga ikke noe svar — prøv igjen.)" };
  } catch {
    return { error: "Kunne ikke generere prisforslag akkurat nå. Prøv igjen." };
  }
}

/** Legg til en sesongpris for en eiendom. RLS sikrer eierskap. */
export async function addSeasonalRate(
  _prev: SeasonalRateState,
  formData: FormData,
): Promise<SeasonalRateState> {
  const user = await requireUser();

  const parsed = seasonalRateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("seasonal_rates").insert({
    property_id: data.property_id,
    name: data.name,
    date_from: data.date_from,
    date_to: data.date_to,
    nightly_rate: data.nightly_rate,
  });
  if (error) return { error: error.message };

  await logAudit({
    user_id: user.id,
    action: "seasonal_rate.created",
    resource_type: "property",
    resource_id: data.property_id,
  });

  revalidatePath("/dashboard/prising");
  return { ok: true };
}

/** Slett en sesongpris. RLS sikrer eierskap. */
export async function deleteSeasonalRate(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("seasonal_rates").delete().eq("id", id);
  revalidatePath("/dashboard/prising");
}

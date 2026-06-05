"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { suggestPricing } from "@/lib/ai";
import { bookedDateSet } from "@/lib/availability";

export type PricingState = { result?: string; error?: string };

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
    .select("name,address,bedrooms,max_guests")
    .eq("id", propertyId)
    .single();
  if (!property) return { error: "Fant ikke eiendommen" };

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
      currentPrice,
    });
    return { result: result || "(Modellen ga ikke noe svar — prøv igjen.)" };
  } catch {
    return { error: "Kunne ikke generere prisforslag akkurat nå. Prøv igjen." };
  }
}

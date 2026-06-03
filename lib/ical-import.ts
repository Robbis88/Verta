import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseICal } from "@/lib/ical-parse";
import type { IcalUrl } from "@/lib/types";

function nights(start: string, end: string): number {
  const ms =
    new Date(`${end}T00:00:00Z`).getTime() -
    new Date(`${start}T00:00:00Z`).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

export type ImportResult = { imported: number; updated: number; failed: number };

/** Importerer alle feeder for én eiendom med en gitt Supabase-klient. */
async function importForProperty(
  supabase: SupabaseClient,
  propertyId: string,
  urls: IcalUrl[],
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, updated: 0, failed: 0 };

  for (const { url, source } of urls) {
    let text: string;
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) {
        result.failed += 1;
        continue;
      }
      text = await res.text();
    } catch {
      result.failed += 1;
      continue;
    }

    for (const event of parseICal(text)) {
      const { data: existing } = await supabase
        .from("bookings")
        .select("id")
        .eq("property_id", propertyId)
        .eq("ical_uid", event.uid)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("bookings")
          .update({
            check_in: event.start,
            check_out: event.end,
            nights: nights(event.start, event.end),
          })
          .eq("id", existing.id);
        result.updated += 1;
      } else {
        const { error } = await supabase.from("bookings").insert({
          property_id: propertyId,
          guest_name: `Importert (${source})`,
          check_in: event.start,
          check_out: event.end,
          nights: nights(event.start, event.end),
          source,
          status: "confirmed",
          ical_uid: event.uid,
        });
        if (error) result.failed += 1;
        else result.imported += 1;
      }
    }
  }

  return result;
}

/** Owner-trigget import (RLS-klient, eier-scope). */
export async function importIcalForProperty(
  propertyId: string,
): Promise<ImportResult> {
  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("ical_urls")
    .eq("id", propertyId)
    .single();
  const urls = (property?.ical_urls ?? []) as IcalUrl[];
  return importForProperty(supabase, propertyId, urls);
}

/** Cron-trigget import for alle eiendommer med feeder (admin-klient). */
export async function importAllIcal(): Promise<{
  properties: number;
  imported: number;
  updated: number;
  failed: number;
}> {
  const supabase = createAdminClient();
  const { data: props } = await supabase
    .from("properties")
    .select("id,ical_urls");

  let properties = 0;
  const agg: ImportResult = { imported: 0, updated: 0, failed: 0 };

  for (const p of (props ?? []) as { id: string; ical_urls: IcalUrl[] | null }[]) {
    const urls = p.ical_urls ?? [];
    if (urls.length === 0) continue;
    properties += 1;
    const r = await importForProperty(supabase, p.id, urls);
    agg.imported += r.imported;
    agg.updated += r.updated;
    agg.failed += r.failed;
  }

  return { properties, ...agg };
}

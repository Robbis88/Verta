import { TidElv } from "@/components/hjem/tid-elv";
import { loadElv } from "@/lib/hus";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * TID — de neste 90 døgnene som en elv: opphold, tomme netter med pris, vask.
 * Leser bookings, seasonal_rates, properties.base_nightly_rate og
 * cleaning_tasks. Ingen prislogikk er endret.
 */
export default async function HjemTidPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select("id,name")
    .order("created_at");
  const boliger = (data ?? []) as { id: string; name: string }[];
  const en = boliger.length === 1 ? boliger[0] : null;

  const elv = await loadElv(supabase, en?.id ?? null, 90);

  return (
    <TidElv
      boligNavn={en?.name ?? null}
      boligAntall={boliger.length}
      elv={elv}
    />
  );
}

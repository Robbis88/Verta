import { HistorieRom } from "@/components/hjem/historie-rom";
import { loadBiografi } from "@/lib/hus";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Husets biografi — alt boligen har vært gjennom, år for år, satt sammen av
 * data som allerede finnes (hendelser, løste saker, utstyrskjøp, bookinger,
 * utgifter, anmeldelser). Laget for å skrives ut og gis til en kjøper.
 */
export default async function HjemHistoriePage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select("id")
    .order("created_at");
  const boliger = (data ?? []) as { id: string }[];
  const en = boliger.length === 1 ? boliger[0] : null;

  const bio = await loadBiografi(supabase, en?.id ?? null);

  return <HistorieRom bio={bio} />;
}

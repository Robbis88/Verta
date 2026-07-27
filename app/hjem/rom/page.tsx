import { RomPlan } from "@/components/hjem/rom-plan";
import { loadHusplan } from "@/lib/hus";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * ROM — boligen innvendig som en plantegning. Kun lesing av eksisterende
 * tabeller; hver sone lenker videre inn i modulen som eier dataene, så all
 * funksjonalitet er intakt.
 */
export default async function HjemRomPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select("id,name")
    .order("created_at");
  const boliger = (data ?? []) as { id: string; name: string }[];
  const en = boliger.length === 1 ? boliger[0] : null;

  const plan = await loadHusplan(supabase, en?.id ?? null);

  return (
    <RomPlan
      boligNavn={en?.name ?? null}
      boligAntall={boliger.length}
      plan={plan}
    />
  );
}

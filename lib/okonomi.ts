import { createClient } from "@/lib/supabase/server";
import { getMockEconomy, type Economy } from "@/lib/okonomi-mock";

export type PropertyRef = { id: string; name: string };

/**
 * Kontekst for Eiendomsøkonomi: brukerens ekte eiendommer (via RLS) + valgt
 * eiendom, med (foreløpig) mock-økonomi. Deles av alle okonomi-sidene.
 */
export async function getEconomyContext(eiendomId?: string): Promise<{
  properties: PropertyRef[];
  selected: PropertyRef | null;
  economy: Economy | null;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id,name")
    .order("created_at", { ascending: true });

  const properties = (data ?? []) as PropertyRef[];
  if (properties.length === 0) {
    return { properties, selected: null, economy: null };
  }

  const selected =
    properties.find((p) => p.id === eiendomId) ?? properties[0];
  return {
    properties,
    selected,
    economy: getMockEconomy(selected.id, selected.name),
  };
}

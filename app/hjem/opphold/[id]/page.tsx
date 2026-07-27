import { notFound } from "next/navigation";

import { OppholdRom } from "@/components/hjem/opphold-rom";
import { loadOpphold } from "@/lib/hus";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Ett opphold, hele historien: gjesten, pengene, tilkomsten, samtalen, vasken
 * etterpå, anmeldelsen og et eventuelt skadekrav. Kun lesing av tabeller som
 * allerede finnes. RLS scoper til eierens egne bookinger, så et fremmed
 * opphold gir 404.
 */
export default async function HjemOppholdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const opphold = await loadOpphold(supabase, id);

  if (!opphold) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verta.no";

  return <OppholdRom opphold={opphold} siteUrl={siteUrl} />;
}

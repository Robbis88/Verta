import { FolkRom } from "@/components/hjem/folk-rom";
import { loadBesetning } from "@/lib/hus";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Besetningen — alle som passer huset, som ansikter. Kun lesing; tildeling av
 * vask går gjennom den eksisterende assignTask-handlingen.
 */
export default async function HjemFolkPage() {
  const supabase = await createClient();
  const besetning = await loadBesetning(supabase);

  return <FolkRom besetning={besetning} />;
}

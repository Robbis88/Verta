import { HjemScreen } from "@/components/hjem/hjem-screen";
import { getCurrentProfile } from "@/lib/auth";
import { loadHusetNa } from "@/lib/hus";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * /hjem — startsiden. Boligen din i stort bilde, én hilsen og ÉN ting som
 * fortjener deg akkurat nå. Bygget kun på lesing av eksisterende tabeller
 * (lib/hus.ts). Det gamle dashbordet med alle tall er urørt på /dashboard.
 */
export default async function HjemPage() {
  const supabase = await createClient();
  const [profile, na] = await Promise.all([
    getCurrentProfile(),
    loadHusetNa(supabase),
  ]);

  const fornavn = (profile?.name ?? "").trim().split(/\s+/)[0] ?? "";

  return <HjemScreen fornavn={fornavn} na={na} />;
}

import { AltRom } from "@/components/hjem/alt-rom";
import { isAdmin } from "@/lib/admin";
import { getCurrentProfile } from "@/lib/auth";
import { navGrupper } from "@/lib/nav-items";

export const dynamic = "force-dynamic";

/**
 * ALT — hele modul-listen, gruppert og søkbar. Dette er menyen: skjult fra
 * daglig bruk, men komplett og alltid ett trykk unna. Admin-moduler vises
 * kun for admin, som før.
 */
export default async function HjemAltPage() {
  const profile = await getCurrentProfile();
  const grupper = navGrupper(isAdmin(profile?.email));

  return (
    <AltRom
      grupper={grupper.map((g) => ({
        tittel: g.tittel,
        hva: g.hva,
        items: g.items.map((i) => ({
          label: i.label,
          href: i.href,
          hint: i.hint,
        })),
      }))}
    />
  );
}

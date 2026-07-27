import { OrdRom } from "@/components/hjem/ord-rom";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * ORD — Vera i fullskjerm. Bruker det eksisterende /api/chat-endepunktet med
 * context «portal», uendret. Kun presentasjonen er ny.
 */
export default async function HjemOrdPage() {
  const profile = await getCurrentProfile();
  const fornavn = (profile?.name ?? "").trim().split(/\s+/)[0] ?? "";

  return <OrdRom fornavn={fornavn} />;
}

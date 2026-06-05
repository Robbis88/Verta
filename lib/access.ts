import { createAdminClient } from "@/lib/supabase/admin";
import { seamEnabled, createBookingAccessCode } from "@/lib/seam";

/**
 * Tilkomst for et opphold: enten en auto-generert smartlås-kode, eller
 * eierens egen nøkkelboks-/innsjekkstekst. Null hvis ingen av delene finnes.
 */
export type BookingAccess =
  | { type: "smartlock"; code: string; accessCodeId: string }
  | { type: "manual"; info: string }
  | null;

/**
 * Skaffer tilkomst for en booking. Har eiendommen en tilkoblet smartlås,
 * lages en tidsbegrenset kode via Seam (Igloohome bruker offline algoPIN).
 * Ellers brukes eierens `access_info`. Feiler aldri — returnerer null.
 */
export async function provisionBookingAccess(opts: {
  propertyId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  label: string;
  accessInfo: string | null;
}): Promise<BookingAccess> {
  const supabase = createAdminClient();

  const { data: lock } = await supabase
    .from("smart_locks")
    .select("device_id,provider")
    .eq("property_id", opts.propertyId)
    .eq("status", "connected")
    .maybeSingle();

  if (seamEnabled && lock?.device_id && lock.device_id !== "pending") {
    try {
      // Kode gyldig fra innsjekk kl. 14 til utsjekk kl. 11 (norsk tid ≈ UTC+1/2).
      const startsAt = new Date(`${opts.checkIn}T13:00:00.000Z`).toISOString();
      const endsAt = new Date(`${opts.checkOut}T09:00:00.000Z`).toISOString();
      const { code, accessCodeId } = await createBookingAccessCode({
        deviceId: lock.device_id,
        name: opts.label,
        startsAt,
        endsAt,
        offline: lock.provider === "igloohome",
      });
      if (code) return { type: "smartlock", code, accessCodeId };
    } catch (err) {
      console.error("Smartlås-kode feilet, faller tilbake til manuell:", err);
    }
  }

  const info = opts.accessInfo?.trim();
  if (info) return { type: "manual", info };

  return null;
}

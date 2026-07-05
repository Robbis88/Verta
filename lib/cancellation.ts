/**
 * Kanselleringspolicy for gjeste-avbestilling. Refusjonsandelen avhenger av
 * hvor lenge før innsjekk gjesten avbestiller. Eier-initiert kansellering gir
 * alltid full refusjon (håndteres separat) — dette gjelder når gjesten selv
 * avbestiller.
 */

/** Andel av beløpet som refunderes (1 = alt, 0.5 = halvparten, 0 = ingenting). */
export function refundFractionForCheckIn(
  checkInISO: string,
  nowMs: number = Date.now(),
): number {
  const checkIn = new Date(`${checkInISO}T00:00:00Z`).getTime();
  const hoursUntil = (checkIn - nowMs) / 3_600_000;
  if (hoursUntil >= 14 * 24) return 1; // 14 dager eller mer → full refusjon
  if (hoursUntil >= 48) return 0.5; // 2–14 dager → 50 %
  return 0; // under 48 timer → ingen refusjon
}

/** Er det fortsatt før innsjekk? (Avgjør om gjesten kan avbestille.) */
export function isBeforeCheckIn(
  checkInISO: string,
  nowMs: number = Date.now(),
): boolean {
  return nowMs < new Date(`${checkInISO}T00:00:00Z`).getTime();
}

/** Menneskelesbar policy for visning på booking-side, gjesteside og e-post. */
export const CANCELLATION_POLICY_LINES = [
  "14 dager eller mer før innsjekk: full refusjon",
  "2–14 dager før innsjekk: 50 % refusjon",
  "Mindre enn 48 timer før innsjekk: ingen refusjon",
];

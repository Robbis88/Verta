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

/** Har et tidspunkt (ISO) passert? Brukes bl.a. for 24t-depositum-fristen. */
export function isPast(iso: string, nowMs: number = Date.now()): boolean {
  return new Date(iso).getTime() < nowMs;
}

/** Menneskelesbar policy for visning på booking-side, gjesteside og e-post. */
export const CANCELLATION_POLICY_LINES = [
  "14 dager eller mer før innsjekk: full refusjon",
  "2–14 dager før innsjekk: 50 % refusjon",
  "Mindre enn 48 timer før innsjekk: ingen refusjon",
];

/** Restbeløpet forfaller så mange dager før innsjekk. */
export const REMAINING_DUE_DAYS_BEFORE = 7;

/** Forfallsdato (ISO yyyy-mm-dd) for restbeløpet, gitt innsjekk. */
export function remainingDueDate(checkInISO: string): string {
  const d = new Date(`${checkInISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - REMAINING_DUE_DAYS_BEFORE);
  return d.toISOString().slice(0, 10);
}

/** Timer til restbetalingsfristen (negativ når fristen har passert). */
export function hoursToRemainingDeadline(
  checkInISO: string,
  nowMs: number = Date.now(),
): number {
  // Fristen gjelder til SLUTTEN av forfallsdatoen («senest» den dagen), ikke
  // kl. 00:00 — ellers kanselleres en gjest som betaler på oppgitt fristdag.
  const deadline = new Date(
    `${remainingDueDate(checkInISO)}T23:59:59Z`,
  ).getTime();
  return (deadline - nowMs) / 3_600_000;
}

/** Policy-tekst for restbetaling (vises på booking-/gjesteside + e-post). */
export const REMAINING_POLICY_TEXT =
  "Restbeløpet må betales senest 7 dager før innsjekk. Betales det ikke innen fristen, avbestilles oppholdet automatisk og depositumet beholdes.";

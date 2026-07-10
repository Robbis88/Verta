const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function periodLabel(year: number, month0: number): string {
  return `${MONTHS[month0]}_${year}`;
}

export type CommissionResult = {
  period: string;
  users: number;
  totalCommission: number;
};

/**
 * Deaktivert: Verta tar ikke lenger provisjon fra utleiere. Gjesten betaler i
 * stedet et tjenestegebyr (7,5 %) ved bestilling, trukket via Stripe
 * application_fee. Beholdt som no-op så cron-jobben ikke feiler; historiske
 * provisjonsrader i `commissions` står urørt.
 */
export async function computeCommissions(
  year: number,
  month0: number,
): Promise<CommissionResult> {
  return { period: periodLabel(year, month0), users: 0, totalCommission: 0 };
}

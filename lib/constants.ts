/**
 * Én kilde til sannhet for planer, grenser og enums.
 * Gjenbrukes i UI, server actions og som referanse for RLS-policyene.
 */

// Én betalt plan: 399 kr/mnd, alt inkludert, 1 bolig (+199/mnd per ekstra).
// 'gratis' beholdes kun som "ikke abonnent"-tilstand (betalingsmuren).
// Intern nøkkel 'premium' = den betalte planen.
export const PLANS = {
  gratis: { label: "Gratis", priceNok: 0 },
  premium: { label: "Verta", priceNok: 399 },
} as const;

export type Plan = keyof typeof PLANS;

export const EXTRA_PROPERTY_PRICE_NOK = 199;

/** Antall eiendommer en bruker kan ha. Abonnent: 1 + kjøpte ekstra à 199/mnd. */
export function propertyLimit(plan: Plan, extra = 0): number {
  return plan === "premium" ? 1 + extra : 1;
}

export const BOOKING_SOURCES = [
  "airbnb",
  "booking",
  "verta_direct",
  "verta_instagram",
  "verta_facebook",
] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];

export const BOOST_STATUSES = [
  "pending",
  "approved",
  "active",
  "completed",
  "failed",
] as const;
export type BoostStatus = (typeof BOOST_STATUSES)[number];

/**
 * Tjenestegebyr på gjestens bestilling. Satt til 0: i direktebooking-modellen
 * betaler gjesten eierens pris direkte (direct charge til eierens konto), og
 * Verta tar 0 % av leien. Feltet/funksjonen beholdes for historikk.
 */
export const SERVICE_FEE_RATE = 0;

/** Beregner tjenestegebyret av utleierens beløp (netter + rengjøring). */
export function serviceFeeOf(amount: number): number {
  return Math.round(amount * SERVICE_FEE_RATE * 100) / 100;
}

/** @deprecated Erstattet av tjenestegebyr på gjesten. Beholdt for historikk. */
export const COMMISSION_RATE = 0.1;

/** Lavere sats på direktebookinger betalt via Verta (dekker gebyr + margin). */
export const DIRECT_COMMISSION_RATE = 0.03;

/** Provisjonssats Verta trekker per bookingkilde ved betaling via Verta. */
export function commissionRate(source: BookingSource): number {
  if (source === "verta_instagram" || source === "verta_facebook") {
    return COMMISSION_RATE;
  }
  if (source === "verta_direct") return DIRECT_COMMISSION_RATE;
  return 0; // airbnb/booking importeres — betales ikke via Verta
}

/** Verta sitt formidlingsgebyr på vaske-oppdrag i markedsplassen. */
export const MARKET_FEE_RATE = 0.1;

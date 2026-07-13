/**
 * Én kilde til sannhet for planer, grenser og enums.
 * Gjenbrukes i UI, server actions og som referanse for RLS-policyene.
 */

export const PLANS = {
  gratis: { label: "Gratis", priceNok: 0 },
  basis: { label: "Basis", priceNok: 149 },
  pluss: { label: "Pluss", priceNok: 249 },
  premium: { label: "Premium", priceNok: 399 },
} as const;

export type Plan = keyof typeof PLANS;

export const EXTRA_PROPERTY_PRICE_NOK = 99;

/** Antall eiendommer en bruker kan ha. Premium kan kjøpe ekstra à 99 kr/mnd. */
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
 * Vertas tjenestegebyr som legges på gjestens bestilling (7,5 % av netter +
 * rengjøring). Gjesten betaler dette på toppen; utleieren får hele sitt beløp.
 * Dekker betaling og Vertas provisjon — ikke vask.
 */
export const SERVICE_FEE_RATE = 0.075;

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

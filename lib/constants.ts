/**
 * Én kilde til sannhet for planer, grenser og enums.
 * Gjenbrukes i UI, server actions og som referanse for RLS-policyene.
 */

export const PLANS = {
  gratis: { label: "Gratis", priceNok: 0 },
  basis: { label: "Basis", priceNok: 149 },
  pluss: { label: "Pluss", priceNok: 249 },
  premium: { label: "Premium", priceNok: 349 },
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

/** Verta tar 10 % provisjon av bookinger fra egne sosiale kanaler. */
export const COMMISSION_RATE = 0.1;

import Stripe from "stripe";

import type { Plan } from "@/lib/constants";

/** Stripe er aktivert kun når en hemmelig nøkkel finnes (ellers dev-fallback). */
export const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

export const stripe = stripeEnabled
  ? new Stripe(process.env.STRIPE_SECRET_KEY!)
  : null;

type PaidPlan = Exclude<Plan, "gratis">;

/** Price-ID for den ene betalte planen (fra Stripe-dashbordet). */
export const PRICE_IDS: Record<PaidPlan, string | undefined> = {
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

/** Valgfri årspris (3 990 kr/år) for samme plan. */
export const PRICE_ID_YEARLY = process.env.STRIPE_PRICE_PREMIUM_YEARLY;

export const EXTRA_PROPERTY_PRICE_ID = process.env.STRIPE_PRICE_EXTRA_PROPERTY;

/** Finner planen som hører til en Stripe price-ID. */
export function planFromPriceId(priceId: string | undefined): PaidPlan | null {
  if (!priceId) return null;
  // Årsprisen er samme plan (premium), bare annen faktureringsperiode.
  if (PRICE_ID_YEARLY && priceId === PRICE_ID_YEARLY) return "premium";
  for (const [plan, id] of Object.entries(PRICE_IDS) as [PaidPlan, string?][]) {
    if (id && id === priceId) return plan;
  }
  return null;
}

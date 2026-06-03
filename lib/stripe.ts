import Stripe from "stripe";

import type { Plan } from "@/lib/constants";

/** Stripe er aktivert kun når en hemmelig nøkkel finnes (ellers dev-fallback). */
export const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

export const stripe = stripeEnabled
  ? new Stripe(process.env.STRIPE_SECRET_KEY!)
  : null;

type PaidPlan = Exclude<Plan, "gratis">;

/** Price-ID per betalt plan (fra Stripe-dashbordet). */
export const PRICE_IDS: Record<PaidPlan, string | undefined> = {
  basis: process.env.STRIPE_PRICE_BASIS,
  pluss: process.env.STRIPE_PRICE_PLUSS,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

export const EXTRA_PROPERTY_PRICE_ID = process.env.STRIPE_PRICE_EXTRA_PROPERTY;

/** Finner planen som hører til en Stripe price-ID. */
export function planFromPriceId(priceId: string | undefined): PaidPlan | null {
  if (!priceId) return null;
  for (const [plan, id] of Object.entries(PRICE_IDS) as [PaidPlan, string?][]) {
    if (id && id === priceId) return plan;
  }
  return null;
}

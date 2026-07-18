"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { propertySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { stripe, stripeEnabled, PRICE_IDS, PRICE_ID_YEARLY } from "@/lib/stripe";
import type { Plan } from "@/lib/constants";

export type PropertyFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Steg 1: oppretter brukerens første eiendom, går videre til planvalg. */
export async function createOnboardingProperty(
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const user = await requireUser();

  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const data = parsed.data;
  const slug = `${slugify(data.name)}-${crypto.randomUUID().slice(0, 6)}`;

  const { data: created, error } = await supabase
    .from("properties")
    .insert({
      user_id: user.id,
      name: data.name,
      slug,
      address: data.address || null,
      description: data.description || null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      max_guests: data.max_guests ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit({
    user_id: user.id,
    action: "property.created",
    resource_type: "property",
    resource_id: created.id,
  });

  revalidatePath("/dashboard/properties");
  redirect("/onboarding/plan");
}

const TIERS = ["premium"] as const;

/** Steg 2: velg plan. Stripe Checkout hvis konfigurert, ellers dev-fallback. */
export async function choosePlan(formData: FormData): Promise<void> {
  const user = await requireUser();
  const tier = String(formData.get("tier") ?? "") as Plan;
  if (!TIERS.includes(tier as (typeof TIERS)[number])) return;

  // Måned (standard) eller år. Årspris brukes kun hvis den er konfigurert.
  const yearly =
    String(formData.get("billing") ?? "") === "yearly" && Boolean(PRICE_ID_YEARLY);

  const supabase = await createClient();

  // Registrer at eieren godtok vilkår + databehandleravtale ved planvalg.
  await supabase
    .from("users")
    .update({ dba_signed_at: new Date().toISOString() })
    .eq("id", user.id);

  const profile = await getCurrentProfile();
  const origin =
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  // Produksjonsflyt: Stripe Checkout.
  const monthlyPrice = PRICE_IDS[tier as (typeof TIERS)[number]];
  const priceId = yearly ? PRICE_ID_YEARLY! : monthlyPrice;
  if (stripe && stripeEnabled && priceId) {
    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      // Tving norsk Checkout uansett nettleserspråk (ellers faller Stripe til auto).
      locale: "nb",
      line_items: [{ price: priceId, quantity: 1 }],
      // 14 dager gratis prøve: kort kreves, men trekkes først etter prøveperioden.
      subscription_data: { trial_period_days: 14 },
      // Verifiser sesjonen ved retur og sett planen synkront, så brukeren ikke
      // bounces tilbake av betalingsmuren før webhooken rekker å oppdatere DB-en.
      success_url: `${origin}/onboarding/fullfort?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/onboarding/plan`,
      metadata: { user_id: user.id, plan: tier },
    });

    redirect(session.url!);
  }

  // Dev-fallback: sett planen direkte (Stripe ikke konfigurert).
  await supabase.from("users").update({ plan: tier }).eq("id", user.id);
  await logAudit({
    user_id: user.id,
    action: "plan.selected.dev",
    resource_type: "user",
    resource_id: user.id,
    changes: { plan: tier },
  });
  redirect("/dashboard?welcome=1");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { MARKET_FEE_RATE } from "@/lib/constants";

export async function requestCleaner(formData: FormData): Promise<void> {
  const user = await requireUser();
  const cleanerId = String(formData.get("cleaner_id") ?? "");
  const propertyId = String(formData.get("property_id") ?? "");
  if (!cleanerId || !propertyId) return;
  const jobDate = String(formData.get("job_date") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = amountRaw ? Number(amountRaw) : null;
  const vertaFee =
    amount != null ? Math.round(amount * MARKET_FEE_RATE * 100) / 100 : null;

  const supabase = await createClient();
  // RLS sikrer at brukeren eier eiendommen i forespørselen.
  const { error } = await supabase.from("service_requests").insert({
    cleaner_id: cleanerId,
    property_id: propertyId,
    requester_user_id: user.id,
    job_date: jobDate || null,
    message: message || null,
    amount,
    verta_fee: vertaFee,
    status: "pending",
  });
  if (error) return;

  await logAudit({
    user_id: user.id,
    action: "service_request.sent",
    resource_type: "cleaner",
    resource_id: cleanerId,
  });
  revalidatePath("/dashboard/finn-vaskehjelp");
}

/** Eier som har hatt et godtatt oppdrag gir vaskeren en vurdering (1–5). */
export async function reviewCleaner(formData: FormData): Promise<void> {
  const user = await requireUser();
  const cleanerId = String(formData.get("cleaner_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  if (!cleanerId || rating < 1 || rating > 5) return;
  const comment = String(formData.get("comment") ?? "").trim();
  const propertyId = String(formData.get("property_id") ?? "");

  const supabase = await createClient();
  // Krev at det finnes et godtatt oppdrag med denne vaskeren.
  const { data: accepted } = await supabase
    .from("service_requests")
    .select("id")
    .eq("cleaner_id", cleanerId)
    .eq("requester_user_id", user.id)
    .eq("status", "accepted")
    .limit(1);
  if (!accepted || accepted.length === 0) return;

  await supabase.from("cleaner_reviews").upsert(
    {
      cleaner_id: cleanerId,
      reviewer_user_id: user.id,
      property_id: propertyId || null,
      rating,
      comment: comment || null,
    },
    { onConflict: "cleaner_id,reviewer_user_id" },
  );
  revalidatePath("/dashboard/finn-vaskehjelp");
}

export async function cancelRequest(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("service_requests")
    .update({ status: "cancelled" })
    .eq("id", id);
  revalidatePath("/dashboard/finn-vaskehjelp");
}

/**
 * Eier betaler et godtatt vaskeoppdrag gjennom Verta: Stripe Checkout med
 * destination charge — Verta beholder 10 % formidlingsgebyr, resten overføres
 * til vaskerens egen konto. Webhooken markerer oppdraget betalt.
 */
export async function payServiceRequest(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // RLS: kun egne forespørsler.
  const { data: req } = await supabase
    .from("service_requests")
    .select("id,cleaner_id,amount,verta_fee,status,payment_status")
    .eq("id", id)
    .maybeSingle();
  if (!req || req.status !== "accepted" || req.payment_status === "paid") {
    redirect("/dashboard/finn-vaskehjelp");
  }
  const amount = Number(req!.amount ?? 0);
  if (amount <= 0) redirect("/dashboard/finn-vaskehjelp");

  // Vaskerens utbetalingskonto (via admin — kan tilhøre en annen bruker).
  const admin = createAdminClient();
  const { data: cleaner } = await admin
    .from("cleaners")
    .select("name,stripe_connect_id,payouts_enabled")
    .eq("id", req!.cleaner_id)
    .maybeSingle();

  if (
    !stripe ||
    !stripeEnabled ||
    !cleaner?.payouts_enabled ||
    !cleaner?.stripe_connect_id
  ) {
    redirect("/dashboard/finn-vaskehjelp?feil=vasker");
  }

  const fee = Number(req!.verta_fee ?? 0);
  const origin =
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "nb",
    line_items: [
      {
        price_data: {
          currency: "nok",
          product_data: {
            name: `Vaskeoppdrag — ${cleaner.name ?? "vasker"}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: Math.round(fee * 100),
      transfer_data: { destination: cleaner.stripe_connect_id },
      metadata: { request_id: req!.id, kind: "service" },
    },
    metadata: { request_id: req!.id, kind: "service" },
    success_url: `${origin}/dashboard/finn-vaskehjelp?betalt=1`,
    cancel_url: `${origin}/dashboard/finn-vaskehjelp`,
  }, { idempotencyKey: `service-${req!.id}` });
  redirect(session.url!);
}

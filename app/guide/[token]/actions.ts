"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendGuideMessage } from "@/lib/email";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { MARKET_FEE_RATE } from "@/lib/constants";

/** Gjesten sender en melding til utleieren fra guiden (eskalering). */
export async function contactHost(
  token: string,
  formData: FormData,
): Promise<void> {
  const message = String(formData.get("message") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim() || null;
  if (!message) redirect(`/guide/${token}`);

  const supabase = createAdminClient();
  const { data: p } = await supabase
    .from("properties")
    .select("name,user_id")
    .eq("guide_token", token)
    .maybeSingle();
  if (!p) redirect(`/guide/${token}`);

  const { data: owner } = await supabase
    .from("users")
    .select("email")
    .eq("id", p!.user_id)
    .single();
  if (owner?.email) {
    await sendGuideMessage({
      to: owner.email,
      propertyName: p!.name,
      message,
      guestContact: contact,
    });
  }
  redirect(`/guide/${token}?sendt=1`);
}

/** Gjesten leier et utstyr og betaler. Verta beholder 10 %, resten til eier. */
export async function rentItem(
  token: string,
  formData: FormData,
): Promise<void> {
  const back = `/guide/${token}?leiefeil=1`;
  const itemId = String(formData.get("item_id") ?? "");
  const guestName = String(formData.get("guest_name") ?? "").trim();
  const guestContact = String(formData.get("guest_contact") ?? "").trim() || null;
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  if (!itemId || !guestName) redirect(back);

  const supabase = createAdminClient();
  const { data: property } = await supabase
    .from("properties")
    .select("id,user_id")
    .eq("guide_token", token)
    .maybeSingle();
  if (!property) redirect(back);

  const { data: item } = await supabase
    .from("rental_items")
    .select("id,name,price,active,property_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item || !item.active || item.property_id !== property!.id) redirect(back);

  const { data: owner } = await supabase
    .from("users")
    .select("stripe_connect_id,payouts_enabled")
    .eq("id", property!.user_id)
    .single();
  if (
    !stripe ||
    !stripeEnabled ||
    !owner?.payouts_enabled ||
    !owner?.stripe_connect_id
  ) {
    redirect(back);
  }

  const amount = Math.round(Number(item!.price) * quantity * 100) / 100;
  const fee = Math.round(amount * MARKET_FEE_RATE * 100) / 100;

  const { data: order } = await supabase
    .from("rental_orders")
    .insert({
      item_id: item!.id,
      property_id: property!.id,
      guest_name: guestName,
      guest_contact: guestContact,
      quantity,
      amount,
      verta_fee: fee,
      status: "pending",
    })
    .select("id")
    .single();
  if (!order) redirect(back);

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "nb",
    line_items: [
      {
        price_data: {
          currency: "nok",
          product_data: { name: `Leie: ${item!.name}` },
          unit_amount: Math.round(Number(item!.price) * 100),
        },
        quantity,
      },
    ],
    // Destination charge: Verta beholder 10 %, resten til eierens konto.
    payment_intent_data: {
      application_fee_amount: Math.round(fee * 100),
      transfer_data: { destination: owner.stripe_connect_id },
      metadata: { rental_order_id: order.id, kind: "rental" },
    },
    metadata: { rental_order_id: order.id, kind: "rental" },
    success_url: `${origin}/guide/${token}?leid=1`,
    cancel_url: `${origin}/guide/${token}`,
  }, { idempotencyKey: `rental-${order.id}` });

  redirect(session.url!);
}

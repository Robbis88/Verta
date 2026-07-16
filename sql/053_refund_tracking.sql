-- 053 — Lagre payment intent for destination charges (vask + utleie), så de kan
-- refunderes trygt senere (reverse_transfer). Uten PI-en kan vi ikke refundere.

alter table public.service_requests
  add column if not exists stripe_payment_intent text;

alter table public.rental_orders
  add column if not exists stripe_payment_intent text;

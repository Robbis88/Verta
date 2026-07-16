-- 055 — Lagre faktisk MRR + faktureringsintervall per bruker, så admin-tall og
-- bruk-rapport blir eksakte også for årskunder (der 3 990/1 990 ≠ 12 × månedspris).
-- Settes av Stripe-webhooken (syncSubscriptionState) fra ekte abonnementsbeløp.

alter table public.users
  add column if not exists billing_interval text; -- 'month' | 'year' | null

alter table public.users
  add column if not exists mrr_nok numeric not null default 0; -- månedlig ekvivalent

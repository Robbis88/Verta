-- 044 — Utbetaling til vaskere via Stripe Connect
-- Samme modell som utleiere: vaskeren kobler egen konto og får betalt sporbart
-- gjennom Verta (minus 12 % formidlingsgebyr). Idempotent.
alter table public.cleaners
  add column if not exists stripe_connect_id text;
alter table public.cleaners
  add column if not exists payouts_enabled boolean not null default false;

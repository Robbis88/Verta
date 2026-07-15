-- 046 — Direktebooking-modell: eier er merchant of record (Stripe Connect Standard)
-- gebyr_bekreftet_at: tidsstempel for at eieren bekreftet at kortgebyr belastes
-- egen konto (vises i onboarding). Idempotent.
alter table public.users
  add column if not exists gebyr_bekreftet_at timestamptz;

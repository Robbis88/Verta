-- 033 — Eiendomsfinans: verdi, lån, rente, avdrag
-- Grunnlaget for balanse/egenkapital/belåningsgrad/renter i Eiendomsøkonomi.
-- Kjør i Supabase SQL Editor. Idempotent.

alter table public.properties
  add column if not exists market_value numeric(12,2);
alter table public.properties
  add column if not exists loan_amount numeric(12,2);
alter table public.properties
  add column if not exists interest_rate numeric(5,2);
alter table public.properties
  add column if not exists monthly_principal numeric(10,2);

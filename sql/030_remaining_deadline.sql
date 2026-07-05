-- 030 — Restbetaling: varsel-trinn (48t/24t før frist)
-- Sporer hvor langt i varslingsløpet en booking har kommet, så cronen ikke
-- sender samme varsel to ganger. 0 = ingen, 1 = 48t-varsel sendt, 2 = 24t sendt.
-- Kjør i Supabase SQL Editor. Idempotent.

alter table public.bookings
  add column if not exists remaining_warn_stage smallint not null default 0;

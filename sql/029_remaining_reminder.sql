-- 029 — Restbetaling: påminnelse-flagg
-- Sporer når restbetalings-påminnelsen ble sendt, så cronen ikke sender den
-- på nytt hver dag. Kjør i Supabase SQL Editor. Idempotent.

alter table public.bookings
  add column if not exists remaining_reminded_at timestamptz;

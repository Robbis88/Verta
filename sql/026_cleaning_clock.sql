-- 026 — GPS-stempling for vaskere
-- Vaskeren stempler inn/ut på en oppgave med tidspunkt + posisjon, så eieren
-- kan se når og hvor jobben ble gjort. Kjør i Supabase SQL Editor. Idempotent.

alter table public.cleaning_tasks
  add column if not exists clock_in_at   timestamptz;
alter table public.cleaning_tasks
  add column if not exists clock_in_lat   numeric(9,6);
alter table public.cleaning_tasks
  add column if not exists clock_in_lng   numeric(9,6);
alter table public.cleaning_tasks
  add column if not exists clock_out_at  timestamptz;
alter table public.cleaning_tasks
  add column if not exists clock_out_lat  numeric(9,6);
alter table public.cleaning_tasks
  add column if not exists clock_out_lng  numeric(9,6);

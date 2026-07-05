-- 032 — Eiendomsdetaljer: fasiliteter, soveplasser, innsjekk-/utsjekktider
-- Beriker den offentlige booking-siden (Airbnb-lignende). Kjør i Supabase SQL
-- Editor. Idempotent. Kart bruker eksisterende lat/lng (ingen nye felter).

alter table public.properties
  add column if not exists amenities text[] not null default '{}';
alter table public.properties
  add column if not exists beds int;
alter table public.properties
  add column if not exists sleeping_arrangements text;
alter table public.properties
  add column if not exists check_in_time text;
alter table public.properties
  add column if not exists check_out_time text;

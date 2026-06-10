-- 019 — Vaske-marked (M1: tilgjengelighet + posisjon)
-- Lar vaskere gjøre seg synlige for andre eiere, og matcher på avstand.

alter table public.cleaners
  add column if not exists available_for_hire boolean not null default false;
alter table public.cleaners
  add column if not exists max_travel_km int;
alter table public.cleaners
  add column if not exists hourly_rate numeric(10,2);
alter table public.cleaners
  add column if not exists bio text;
alter table public.cleaners
  add column if not exists base_address text;
alter table public.cleaners
  add column if not exists lat double precision;
alter table public.cleaners
  add column if not exists lng double precision;

-- Posisjon på eiendommer (geokodet fra adresse) for avstandsmatch.
alter table public.properties
  add column if not exists lat double precision;
alter table public.properties
  add column if not exists lng double precision;

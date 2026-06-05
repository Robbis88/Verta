-- 009 — Tilkomstinfo og adgangskoder
-- Lar eiere uten smartlås legge inn nøkkelboks-/innsjekksinstruksjoner,
-- og lagrer auto-genererte smartlås-koder per booking.

alter table public.properties
  add column if not exists access_info text;

alter table public.bookings
  add column if not exists access_code text;
alter table public.bookings
  add column if not exists access_code_id text;

-- 062 — Spor om gjestelenken er sendt til gjesten.
-- Én oppholdslenke styrer hele oppholdet (også for Airbnb/Booking-gjester som
-- eieren registrerer selv). Dashbordet minner om bookinger der lenken ennå
-- ikke er markert som sendt, så ingen gjest blir stående uten innsjekk-info.

alter table public.bookings
  add column if not exists guest_link_sent boolean not null default false;

alter table public.bookings
  add column if not exists guest_link_sent_at timestamptz;  -- null = ikke sendt

-- 057 — Sen utsjekk / tidlig innsjekk som betalt oppsalg (direkte til eier).
-- Eier setter pris per bolig (null = ikke tilbudt). Gjesten kjøper på
-- gjestesiden hvis kalenderen tillater det. Bookingen markeres når betalt.

alter table public.properties
  add column if not exists late_checkout_price numeric;  -- null = ikke tilbudt

alter table public.properties
  add column if not exists early_checkin_price numeric;   -- null = ikke tilbudt

alter table public.bookings
  add column if not exists late_checkout_paid boolean not null default false;

alter table public.bookings
  add column if not exists early_checkin_paid boolean not null default false;

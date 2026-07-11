-- 041 — Eier-token for å godkjenne/avslå forespørsler direkte fra e-post
-- Ugjennomsiktig token så eieren kan svare uten innlogging via /godkjenn/[token].
-- Volatil default gir hver eksisterende rad en egen verdi. Idempotent.
alter table public.bookings
  add column if not exists owner_token uuid not null default gen_random_uuid();

-- 040 — Tjenestegebyr på gjeste-bestillinger
-- service_fee: Vertas gebyr (7,5 %) som gjesten betaler på toppen. total_price
-- forblir utleierens inntekt (netter + rengjøring); amount_total = det gjesten
-- faktisk betaler (total_price + service_fee). Idempotent.
alter table public.bookings
  add column if not exists service_fee numeric;

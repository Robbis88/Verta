-- 051 — Døgnpris for utstyrsutleie.
-- price = pris for første døgn. price_extra_day = pris per ekstra døgn (valgfri;
-- er den tom brukes price for alle døgn). rental_orders.days = antall døgn leid.

alter table public.rental_items
  add column if not exists price_extra_day numeric;

alter table public.rental_orders
  add column if not exists days int not null default 1;

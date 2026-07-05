-- 028 — Forespørsel-booking: godkjenning, depositum, gjeste-info
-- Per-eiendom kan eier velge 'instant' (bestill+betal med en gang) eller
-- 'request' (gjest sender forespørsel → eier godkjenner → depositum låser).
-- Kjør i Supabase SQL Editor. Idempotent (kan kjøres på nytt).

-- =========================================================================
-- properties — bookingmodus
-- =========================================================================
alter table public.properties
  add column if not exists booking_mode text not null default 'instant'
    check (booking_mode in ('instant', 'request'));

-- =========================================================================
-- bookings — nye statuser + gjeste-info + depositum/rest
-- =========================================================================
-- requested = forespørsel (låser IKKE datoene), approved = godkjent (venter
-- depositum, datoene holdes 24t). Constrainten ble sist satt i 027.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in (
    'confirmed', 'cancelled', 'completed', 'pending', 'requested', 'approved'
  ));

-- Gjeste-info for eiers vurdering.
alter table public.bookings add column if not exists num_guests int;
alter table public.bookings add column if not exists guest_message text;
alter table public.bookings add column if not exists approved_at timestamptz;

-- Depositum (betales ved godkjenning) + restbeløp (betales før innsjekk).
alter table public.bookings add column if not exists deposit_amount numeric(10,2);
alter table public.bookings add column if not exists remaining_amount numeric(10,2);
alter table public.bookings
  add column if not exists remaining_paid boolean not null default false;
alter table public.bookings add column if not exists remaining_session_id text;
alter table public.bookings
  add column if not exists remaining_payment_intent text;

create index if not exists bookings_remaining_session_idx
  on public.bookings(remaining_session_id)
  where remaining_session_id is not null;

-- =========================================================================
-- Dobbeltbooking-sperre — forespørsler skal IKKE låse datoene
-- =========================================================================
-- Flere gjester kan forespørre samme dato; eier velger én. Først når en booking
-- er godkjent/holdt/bekreftet låses datoene. Utvider derfor unntaket fra 027 til
-- også å gjelde 'requested'.
alter table public.bookings drop constraint if exists bookings_no_overlap;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_overlap'
  ) then
    begin
      alter table public.bookings
        add constraint bookings_no_overlap
        exclude using gist (
          property_id with =,
          daterange(check_in, check_out, '[)') with &&
        ) where (status not in ('cancelled', 'requested'));
    exception when exclusion_violation then
      raise notice 'bookings_no_overlap ikke lagt til: eksisterende overlapp finnes. Rydd opp og kjør på nytt.';
    end;
  end if;
end $$;

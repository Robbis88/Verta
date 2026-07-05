-- 027 — Gjeste-betaling (Stripe Connect) + dobbeltbooking-sperre
-- Legger til utbetalingsfelt på eier (Connect), betalingsfelt på booking,
-- en ny `pending`-status (holdt, ikke betalt ennå), og en database-nivå
-- EXCLUDE-constraint som fysisk hindrer overlappende bookinger.
-- Kjør i Supabase SQL Editor. Idempotent (kan kjøres på nytt).

-- Kreves av EXCLUDE-constrainten under (gist på scalar + range).
create extension if not exists btree_gist;

-- =========================================================================
-- users — Stripe Connect (utbetaling til eier)
-- =========================================================================
-- Eierens tilkoblede Stripe-konto (Express). Skilt fra stripe_customer_id,
-- som kun gjelder eierens eget abonnement.
alter table public.users
  add column if not exists stripe_connect_id text;
-- true når Connect-kontoen er ferdig onboardet og kan motta utbetalinger
-- (speiler Stripe sin charges_enabled/payouts_enabled via account.updated).
alter table public.users
  add column if not exists payouts_enabled boolean not null default false;

-- =========================================================================
-- bookings — betalingsfelt
-- =========================================================================
-- null  = ingen betaling gjennom Verta (off-platform / importert fra Airbnb/Booking)
-- pending = checkout startet, venter på betaling
-- paid    = betalt
-- refunded/failed = selvforklarende
alter table public.bookings
  add column if not exists payment_status text
    check (payment_status in ('pending','paid','refunded','failed'));
alter table public.bookings
  add column if not exists stripe_session_id text;
alter table public.bookings
  add column if not exists stripe_payment_intent text;
-- Totalbeløp gjesten belastes (kroner). Speiler total_price ved betaling.
alter table public.bookings
  add column if not exists amount_total numeric(10,2);
-- Vertas kutt (application_fee) på denne bookingen.
alter table public.bookings
  add column if not exists application_fee numeric(10,2);
-- Midlertidig reservasjon: en pending booking holder datoene til dette
-- tidspunktet. Utløper checkout uten betaling, frigis holdet (→ cancelled).
alter table public.bookings
  add column if not exists hold_expires_at timestamptz;

-- Rask oppslag fra webhooks (checkout.session.completed / payment_intent.*).
create index if not exists bookings_stripe_session_idx
  on public.bookings(stripe_session_id)
  where stripe_session_id is not null;
create index if not exists bookings_stripe_payment_intent_idx
  on public.bookings(stripe_payment_intent)
  where stripe_payment_intent is not null;
-- For cron som rydder utløpte hold.
create index if not exists bookings_hold_expires_idx
  on public.bookings(hold_expires_at)
  where status = 'pending';

-- =========================================================================
-- bookings.status — legg til 'pending' (holdt, ikke betalt)
-- =========================================================================
-- Constrainten er definert inline i 001 (auto-navn bookings_status_check) og
-- aldri endret siden. Trygt å droppe og gjenskape med den nye verdien.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('confirmed','cancelled','completed','pending'));

-- =========================================================================
-- Dobbeltbooking-sperre — databasen nekter fysisk overlapp
-- =========================================================================
-- Half-open datointervall [check_in, check_out): utsjekk-dagen teller ikke som
-- opptatt, så en ny gjest kan sjekke inn samme dag som forrige sjekker ut.
-- Gjelder alle ikke-kansellerte bookinger (også pending hold).
-- Legges til beskyttet: om eksisterende data allerede overlapper, hopper vi
-- over med en beskjed i stedet for å feile hele migrasjonen.
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
        ) where (status <> 'cancelled');
    exception when exclusion_violation then
      raise notice 'bookings_no_overlap ikke lagt til: eksisterende overlappende bookinger finnes. Rydd opp i overlapp og kjør migrasjonen på nytt.';
    end;
  end if;
end $$;

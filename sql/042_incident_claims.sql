-- 042 — Skadekrav mot gjest i etterkant (uten depositum under oppholdet)
-- Eier melder skade (beløp, beskrivelse, bilder). Gjesten får et krav på e-post
-- og betaler via lenke — kortet belastes først da. Kun for Verta-bookinger.

-- Offentlig bucket for skadebilder (vises for gjesten i kravet).
insert into storage.buckets (id, name, public)
values ('incident-photos', 'incident-photos', true)
on conflict (id) do update set public = true;

create table if not exists public.incident_claims (
  id                    uuid primary key default gen_random_uuid(),
  booking_id            uuid not null references public.bookings(id) on delete cascade,
  property_id           uuid not null references public.properties(id) on delete cascade,
  claim_token           uuid not null default gen_random_uuid(),
  amount                numeric not null check (amount > 0),
  description           text,
  photos                jsonb, -- array med offentlige bilde-URLer
  status                text not null default 'pending', -- pending | paid | cancelled
  stripe_session_id     text,
  stripe_payment_intent text,
  created_at            timestamptz not null default now()
);

create index if not exists incident_claims_booking_idx
  on public.incident_claims (booking_id);
create unique index if not exists incident_claims_token_uniq
  on public.incident_claims (claim_token);

alter table public.incident_claims enable row level security;

-- Eier har full tilgang til krav for egne eiendommer. Gjeste-betaling og
-- kravsiden går via service-role (token er tilgangsnøkkelen).
drop policy if exists incident_claims_owner on public.incident_claims;
create policy incident_claims_owner on public.incident_claims
  for all to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );

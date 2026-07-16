-- 059 — Tjeneste-motor per bolig (pool, badstamp, brøyting, vask underveis …).
--  property_services: eierens tjenester. Enten fast tidsplan (AI svarer «renses
--    ons & fre») eller på bestilling (gjest ber → eier ruter til leverandør).
--  property_service_requests: gjestens på-bestilling-forespørsler.
-- Rører ingen eksisterende funksjon.

create table if not exists public.property_services (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  name           text not null,             -- «Pool-rensing», «Badstamp», «Brøyting»
  kind           text not null default 'on_demand', -- 'scheduled' | 'on_demand'
  schedule_days  text,                      -- «Onsdag, Fredag» (for scheduled)
  provider_name  text,
  provider_phone text,                      -- wa.me/sms til leverandør
  provider_email text,                      -- auto-varsel ved forespørsel
  note           text,                      -- ekstra info vist til gjest
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists property_services_property_idx
  on public.property_services (property_id);

alter table public.property_services enable row level security;

-- Eier styrer; gjesteguiden leser via service-role (admin-klient).
drop policy if exists property_services_owner on public.property_services;
create policy property_services_owner on public.property_services
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

create table if not exists public.property_service_requests (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  service_id    uuid references public.property_services(id) on delete set null,
  service_name  text not null,              -- kopi, så navnet består om tjenesten slettes
  guest_name    text not null,
  guest_contact text,
  desired_date  text,
  message       text,
  status        text not null default 'pending', -- pending | handled | declined
  created_at    timestamptz not null default now()
);

create index if not exists property_service_requests_property_idx
  on public.property_service_requests (property_id, created_at desc);

alter table public.property_service_requests enable row level security;

-- Eier ser/håndterer sine forespørsler; gjest oppretter via service-role.
drop policy if exists property_service_requests_owner on public.property_service_requests;
create policy property_service_requests_owner on public.property_service_requests
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

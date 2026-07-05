-- 034 — Delt eierskap: medeiere + innbetalinger
-- Grunnlag for eierandeler, betalt vs. skulle betalt og oppgjør i
-- Eiendomsøkonomi. Kjør i Supabase SQL Editor. Idempotent.

create table if not exists public.property_owners (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name        text not null,
  share_pct   numeric(5,2) not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists property_owners_property_id_idx
  on public.property_owners(property_id);

create table if not exists public.owner_contributions (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id    uuid not null references public.property_owners(id) on delete cascade,
  amount      numeric(12,2) not null,
  note        text,
  paid_date   date not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists owner_contributions_property_id_idx
  on public.owner_contributions(property_id);

-- RLS: kun eier av eiendommen (owns_property brukes også av expenses/seasonal).
alter table public.property_owners enable row level security;
alter table public.owner_contributions enable row level security;

drop policy if exists property_owners_all_own on public.property_owners;
create policy property_owners_all_own on public.property_owners
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

drop policy if exists owner_contributions_all_own on public.owner_contributions;
create policy owner_contributions_all_own on public.owner_contributions
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

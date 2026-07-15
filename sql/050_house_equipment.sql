-- 050 — Utstyrs-liste per eiendom (TV, AC, kaffemaskin, vaskemaskin osv.)
-- Eieren registrerer hva som finnes i boligen med merke/modell og notater.
-- AI-concierge-en i gjesteguiden bruker dette til å forklare gjestene hvordan
-- hvert apparat brukes (basert på modell + eierens notater).

create table if not exists public.house_equipment (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  name           text not null,          -- «TV i stuen»
  category       text,                   -- TV, Kjøkken, Klima, Vaskemaskin, Annet ...
  location       text,                   -- «Stue»
  brand          text,                   -- «Samsung»
  model          text,                   -- «UE55TU8000»
  purchased_at   date,
  warranty_until date,
  notes          text,                   -- «Fjernkontroll i skuffen»
  created_at     timestamptz not null default now()
);

create index if not exists house_equipment_property_idx
  on public.house_equipment (property_id);

alter table public.house_equipment enable row level security;

-- Eier styrer eget utstyr. Guiden leser via service-role (admin-klient).
drop policy if exists house_equipment_owner on public.house_equipment;
create policy house_equipment_owner on public.house_equipment
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

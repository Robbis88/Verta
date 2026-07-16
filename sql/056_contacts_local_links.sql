-- 056 — To additive moduler (rører ingen eksisterende funksjon):
--  1) property_contacts: eierens faste folk (snekker, vaktmester, brøyting …)
--     med ett-trykks ring/SMS/e-post. Kun for eier (ikke gjest).
--  2) local_links: lokale tjenester/levering (matvarer m.m.) som vises i
--     gjesteguiden. Eier styrer; guiden leser via service-role.

create table if not exists public.property_contacts (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name        text not null,            -- «Ola Hansen»
  role        text,                     -- «Snekker», «Brøyting», «Vaktmester» …
  phone       text,                     -- tel:/sms:/wa.me
  email       text,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists property_contacts_property_idx
  on public.property_contacts (property_id);

alter table public.property_contacts enable row level security;

-- Kun eier ser/styrer sine kontakter (ikke eksponert til gjest).
drop policy if exists property_contacts_owner on public.property_contacts;
create policy property_contacts_owner on public.property_contacts
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

create table if not exists public.local_links (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title       text not null,            -- «Meny hjemlevering»
  url         text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists local_links_property_idx
  on public.local_links (property_id);

alter table public.local_links enable row level security;

-- Eier styrer; gjesteguiden leser via service-role (admin-klient).
drop policy if exists local_links_owner on public.local_links;
create policy local_links_owner on public.local_links
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

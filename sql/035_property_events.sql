-- 035 — Historikk: hendelseslogg per eiendom
-- Tidslinjen i Eiendomsøkonomi (kjøp, oppussing, vedlikehold, finans, verdi).
-- Kjør i Supabase SQL Editor. Idempotent.

create table if not exists public.property_events (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  event_date  date not null,
  title       text not null,
  kind        text not null default 'vedlikehold'
                check (kind in ('kjop', 'oppussing', 'vedlikehold', 'finans', 'verdi')),
  amount      numeric(12,2),
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists property_events_property_id_idx
  on public.property_events(property_id);

alter table public.property_events enable row level security;

drop policy if exists property_events_all_own on public.property_events;
create policy property_events_all_own on public.property_events
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

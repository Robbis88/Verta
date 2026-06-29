-- 025 — Vaskebilder (før/etter)
-- Privat Storage-bucket + tabell som kobler bilder til rengjøringsoppgaver.
-- Vaskeren laster opp via portal-token (server-side med service-role), eieren
-- ser bildene som bevis på utført jobb. Kjør i Supabase SQL Editor. Idempotent.

-- Privat bucket. All tilgang går server-side via service-role, så vi trenger
-- ingen public-tilgang eller storage.objects-policies for anon/authenticated.
insert into storage.buckets (id, name, public)
values ('cleaning-photos', 'cleaning-photos', false)
on conflict (id) do nothing;

create table if not exists public.cleaning_photos (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.cleaning_tasks(id) on delete cascade,
  property_id  uuid not null references public.properties(id) on delete cascade,
  kind         text not null default 'after' check (kind in ('before','after')),
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create index if not exists cleaning_photos_task_id_idx
  on public.cleaning_photos(task_id);

alter table public.cleaning_photos enable row level security;

-- Eieren (og co-host) kan se bilder for egne eiendommer. Opplasting og sletting
-- skjer server-side med service-role (vaskeren har token, ikke innlogging).
drop policy if exists cleaning_photos_select_own on public.cleaning_photos;
create policy cleaning_photos_select_own on public.cleaning_photos
  for select to authenticated using (public.owns_property(property_id));

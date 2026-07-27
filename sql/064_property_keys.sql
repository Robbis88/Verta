-- 064 — Nøkkelknippet: hvem har hvilken nøkkel akkurat nå
-- Eieren registrerer nøklene til boligen og hvem som har dem for øyeblikket
-- (vasker, nabo, håndverker, nøkkelboks). Vises som et knippe i Huset
-- (/hjem/rom → Nøkler) og som kort på eiendomssiden.
-- Kjør i Supabase SQL Editor. Idempotent (trygt å kjøre på nytt).

create table if not exists public.property_keys (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  label        text not null,            -- «Hovednøkkel», «Reserve 1», «Bod»
  key_type     text not null default 'fysisk'
                 check (key_type in ('fysisk','nokkelboks','kort','brikke','kode','annet')),
  copies       int not null default 1,
  holder       text,                     -- «Hos vasker Maria», «I nøkkelboks ved døra»
  notes        text,
  updated_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists property_keys_property_idx
  on public.property_keys (property_id);

alter table public.property_keys enable row level security;

-- Kun eier (og co-host via owns_property) ser og styrer nøklene. Aldri gjest.
drop policy if exists property_keys_owner on public.property_keys;
create policy property_keys_owner on public.property_keys
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

-- Holder «sist endret» ærlig, så «hos hvem» aldri er gammel info uten at du ser det.
drop trigger if exists property_keys_set_updated_at on public.property_keys;
create trigger property_keys_set_updated_at
  before update on public.property_keys
  for each row execute function public.set_updated_at();

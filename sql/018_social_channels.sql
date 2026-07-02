-- 018 — Verta sosiale kanaler
-- Plattform-nivå tabell for Vertas egne sosiale kontoer + publiseringsfelter
-- på boosts. Kun service-role (admin) har tilgang — ingen vanlig bruker.

create table if not exists public.social_accounts (
  id                     uuid primary key default gen_random_uuid(),
  platform               text not null unique,
  handle                 text,
  status                 text not null default 'connected'
                           check (status in ('connected','manual','disconnected')),
  external_ref           text,
  access_token_encrypted text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- RLS på: ingen policy = kun service-role (admin-klient) slipper til.
alter table public.social_accounts enable row level security;

-- Publiseringsstatus på boosts (for kø + sporing).
alter table public.boosts add column if not exists published_at timestamptz;
alter table public.boosts add column if not exists published_url text;

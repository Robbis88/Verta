-- 003 — smart_locks, tax_reports

-- =========================================================================
-- smart_locks  (Premium — Nuki først)
-- =========================================================================
create table if not exists public.smart_locks (
  id                      uuid primary key default gen_random_uuid(),
  property_id             uuid not null references public.properties(id) on delete cascade,
  provider                text not null check (provider in ('nuki','yale','august')),
  device_id               text not null,
  access_token_encrypted  text not null,
  refresh_token_encrypted text,
  status                  text not null default 'connected'
                            check (status in ('connected','error','disconnected')),
  last_synced_at          timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists smart_locks_property_id_idx on public.smart_locks(property_id);

drop trigger if exists smart_locks_set_updated_at on public.smart_locks;
create trigger smart_locks_set_updated_at
  before update on public.smart_locks
  for each row execute function public.set_updated_at();

-- =========================================================================
-- tax_reports  (årlig, norsk skatt)
-- =========================================================================
create table if not exists public.tax_reports (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  year                     int not null,
  total_income             numeric(10,2),
  income_from_airbnb       numeric(10,2),
  income_from_booking      numeric(10,2),
  income_from_verta_direct numeric(10,2),
  income_from_verta_boosts numeric(10,2),
  verta_commission_paid    numeric(10,2),
  taxable_income           numeric(10,2),
  status                   text not null default 'draft'
                             check (status in ('draft','ready_for_skatteetaten','submitted')),
  generated_at             timestamptz not null default now(),
  unique (user_id, year)
);

create index if not exists tax_reports_user_id_idx on public.tax_reports(user_id);

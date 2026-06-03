-- 001 â€” users, properties, bookings
-- KjÃ¸r i Supabase SQL Editor. Idempotent (kan kjÃ¸res pÃ¥ nytt).

-- =========================================================================
-- users  (utvider auth.users; PK = auth.users.id, IKKE fÃ¸dselsnummer)
-- =========================================================================
create table if not exists public.users (
  id                      uuid primary key references auth.users(id) on delete cascade,
  vipps_sub               text unique,                 -- ugjennomsiktig Vipps-id (ikke SSN)
  name                    text,
  email                   text unique not null,
  phone                   text,
  address                 text,
  plan                    text not null default 'gratis'
                            check (plan in ('gratis','basis','pluss','premium')),
  stripe_customer_id      text,
  extra_properties_count  int not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Auto-opprett public.users-rad nÃ¥r en auth-bruker opprettes.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, phone, vipps_sub)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'phone_number', ''),
    nullif(new.raw_user_meta_data->>'sub', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Felles updated_at-trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- =========================================================================
-- properties
-- =========================================================================
create table if not exists public.properties (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  name               text not null,
  slug               text unique not null,            -- offentlig booking-URL
  address            text,
  description        text,
  bedrooms           int,
  bathrooms          int,
  max_guests         int,
  images             jsonb not null default '[]'::jsonb,
  airbnb_calendar_id text,
  booking_email      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists properties_user_id_idx on public.properties(user_id);

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- =========================================================================
-- bookings
-- =========================================================================
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties(id) on delete cascade,
  guest_name      text not null,
  guest_email     text,
  guest_phone     text,
  check_in        date not null,
  check_out       date not null,
  total_price     numeric(10,2),
  nights          int,
  source          text not null
                    check (source in ('airbnb','booking','verta_direct','verta_instagram','verta_facebook')),
  utm_campaign_id text,
  status          text not null default 'confirmed'
                    check (status in ('confirmed','cancelled','completed')),
  notes           text,
  created_at      timestamptz not null default now(),
  constraint valid_dates check (check_out > check_in)
);

create index if not exists bookings_property_id_idx on public.bookings(property_id);
create index if not exists bookings_source_idx on public.bookings(source);

-- 002 â€” boosts, commissions

-- =========================================================================
-- boosts  (annonsekampanjer)
-- =========================================================================
create table if not exists public.boosts (
  id                  uuid primary key default gen_random_uuid(),
  property_id         uuid not null references public.properties(id) on delete cascade,
  status              text not null default 'pending'
                        check (status in ('pending','approved','active','completed','failed')),
  budget_nok          numeric(10,2) not null,
  platform            text not null check (platform in ('instagram','facebook','both')),
  start_date          date not null,
  end_date            date not null,
  ai_generated_text   text,
  user_approved_text  text,
  image_url           text,
  utm_campaign_id     text unique,
  bookings_count      int not null default 0,
  revenue_from_boost  numeric(10,2) not null default 0,
  commission_amount   numeric(10,2),
  created_at          timestamptz not null default now(),
  approved_at         timestamptz,
  completed_at        timestamptz,
  constraint valid_boost_dates check (end_date > start_date)
);

create index if not exists boosts_property_id_idx on public.boosts(property_id);

-- =========================================================================
-- commissions  (mÃ¥nedlige utbetalinger, 10 % av kanal-bookinger)
-- =========================================================================
create table if not exists public.commissions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  period            text not null,                 -- f.eks. 'january_2026'
  booking_ids       uuid[] not null,
  total_revenue     numeric(10,2),
  commission_amount numeric(10,2),
  status            text not null default 'pending'
                      check (status in ('pending','processed','paid')),
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  unique (user_id, period)
);

create index if not exists commissions_user_id_idx on public.commissions(user_id);

-- 003 â€” smart_locks, tax_reports

-- =========================================================================
-- smart_locks  (Premium â€” Nuki fÃ¸rst)
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
-- tax_reports  (Ã¥rlig, norsk skatt)
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

-- 004 â€” audit_log, cookie_consents

-- =========================================================================
-- audit_log  (append-only)
-- =========================================================================
create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  action        text not null,
  resource_type text,
  resource_id   uuid,
  changes       jsonb,
  severity      text not null default 'info'
                  check (severity in ('info','warning','security')),
  ip_address    inet,
  created_at    timestamptz not null default now()
);

create index if not exists audit_log_user_id_idx on public.audit_log(user_id);
create index if not exists audit_log_created_at_idx on public.audit_log(created_at);

-- =========================================================================
-- cookie_consents  (GDPR)
-- =========================================================================
create table if not exists public.cookie_consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  session_id  text,                                  -- for ikke-innloggede
  analytics   boolean not null default false,
  marketing   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Unikhet per bruker ELLER per session (kan ikke uttrykkes med coalesce i
-- en vanlig unique-constraint, sÃ¥ vi bruker to partielle unike indekser).
create unique index if not exists cookie_consents_user_uniq
  on public.cookie_consents(user_id) where user_id is not null;
create unique index if not exists cookie_consents_session_uniq
  on public.cookie_consents(session_id) where session_id is not null;

-- 005 â€” Row-Level Security
-- Aktiverer RLS og policyer pÃ¥ alle brukereide tabeller.
-- Service-role-klienten (admin) omgÃ¥r RLS og brukes til webhooks,
-- offentlige direkte-bookinger og audit-logging.

-- =========================================================================
-- users
-- =========================================================================
alter table public.users enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select to authenticated using (id = auth.uid());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- INSERT skjer via handle_new_user()-triggeren (security definer).

-- =========================================================================
-- properties  (inkl. feature-gating pÃ¥ antall eiendommer)
-- =========================================================================
alter table public.properties enable row level security;

drop policy if exists properties_select_own on public.properties;
create policy properties_select_own on public.properties
  for select to authenticated using (user_id = auth.uid());

drop policy if exists properties_insert_own on public.properties;
create policy properties_insert_own on public.properties
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      (select count(*) from public.properties where user_id = auth.uid())
      <
      case
        when (select plan from public.users where id = auth.uid()) = 'premium'
          then 1 + coalesce((select extra_properties_count from public.users where id = auth.uid()), 0)
        else 1
      end
    )
  );

drop policy if exists properties_update_own on public.properties;
create policy properties_update_own on public.properties
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists properties_delete_own on public.properties;
create policy properties_delete_own on public.properties
  for delete to authenticated using (user_id = auth.uid());

-- =========================================================================
-- Hjelper: eier en bruker eiendommen bak denne raden?
-- =========================================================================
create or replace function public.owns_property(p_property_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.properties
    where id = p_property_id and user_id = auth.uid()
  );
$$;

-- =========================================================================
-- bookings  (eid via property)
-- =========================================================================
alter table public.bookings enable row level security;

drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own on public.bookings
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists bookings_insert_own on public.bookings;
create policy bookings_insert_own on public.bookings
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists bookings_update_own on public.bookings;
create policy bookings_update_own on public.bookings
  for update to authenticated using (public.owns_property(property_id)) with check (public.owns_property(property_id));

drop policy if exists bookings_delete_own on public.bookings;
create policy bookings_delete_own on public.bookings
  for delete to authenticated using (public.owns_property(property_id));

-- =========================================================================
-- boosts  (eid via property)
-- =========================================================================
alter table public.boosts enable row level security;

drop policy if exists boosts_select_own on public.boosts;
create policy boosts_select_own on public.boosts
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists boosts_insert_own on public.boosts;
create policy boosts_insert_own on public.boosts
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists boosts_update_own on public.boosts;
create policy boosts_update_own on public.boosts
  for update to authenticated using (public.owns_property(property_id)) with check (public.owns_property(property_id));

-- =========================================================================
-- smart_locks  (eid via property)
-- =========================================================================
alter table public.smart_locks enable row level security;

drop policy if exists smart_locks_select_own on public.smart_locks;
create policy smart_locks_select_own on public.smart_locks
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists smart_locks_insert_own on public.smart_locks;
create policy smart_locks_insert_own on public.smart_locks
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists smart_locks_update_own on public.smart_locks;
create policy smart_locks_update_own on public.smart_locks
  for update to authenticated using (public.owns_property(property_id)) with check (public.owns_property(property_id));

drop policy if exists smart_locks_delete_own on public.smart_locks;
create policy smart_locks_delete_own on public.smart_locks
  for delete to authenticated using (public.owns_property(property_id));

-- =========================================================================
-- commissions  (eid av bruker; opprettes/oppdateres av admin i cron)
-- =========================================================================
alter table public.commissions enable row level security;

drop policy if exists commissions_select_own on public.commissions;
create policy commissions_select_own on public.commissions
  for select to authenticated using (user_id = auth.uid());

-- =========================================================================
-- tax_reports  (eid av bruker; bruker genererer egen rapport)
-- =========================================================================
alter table public.tax_reports enable row level security;

drop policy if exists tax_reports_select_own on public.tax_reports;
create policy tax_reports_select_own on public.tax_reports
  for select to authenticated using (user_id = auth.uid());

drop policy if exists tax_reports_insert_own on public.tax_reports;
create policy tax_reports_insert_own on public.tax_reports
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists tax_reports_update_own on public.tax_reports;
create policy tax_reports_update_own on public.tax_reports
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================================
-- audit_log  (kun lesing av egne rader; skriving skjer via admin)
-- =========================================================================
alter table public.audit_log enable row level security;

drop policy if exists audit_log_select_own on public.audit_log;
create policy audit_log_select_own on public.audit_log
  for select to authenticated using (user_id = auth.uid());

-- =========================================================================
-- cookie_consents  (innloggede styrer egne; anonyme hÃ¥ndteres av admin)
-- =========================================================================
alter table public.cookie_consents enable row level security;

drop policy if exists cookie_consents_select_own on public.cookie_consents;
create policy cookie_consents_select_own on public.cookie_consents
  for select to authenticated using (user_id = auth.uid());

drop policy if exists cookie_consents_insert_own on public.cookie_consents;
create policy cookie_consents_insert_own on public.cookie_consents
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists cookie_consents_update_own on public.cookie_consents;
create policy cookie_consents_update_own on public.cookie_consents
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());



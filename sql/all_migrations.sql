-- ==============================================================
-- Verta — komplett skjema (migrasjon 001–037, i rekkefølge)
-- Autogenerert. TRYGG på en TOM database; på en delvis migrert base
-- kjør heller kun de manglende filene.
-- ==============================================================


-- ============================================================
-- 001_users_properties_bookings.sql
-- ============================================================
-- 001 — users, properties, bookings
-- Kjør i Supabase SQL Editor. Idempotent (kan kjøres på nytt).

-- =========================================================================
-- users  (utvider auth.users; PK = auth.users.id, IKKE fødselsnummer)
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

-- Auto-opprett public.users-rad når en auth-bruker opprettes.
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


-- ============================================================
-- 002_boosts_commissions.sql
-- ============================================================
-- 002 — boosts, commissions

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
-- commissions  (månedlige utbetalinger, 10 % av kanal-bookinger)
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


-- ============================================================
-- 003_smart_locks_tax.sql
-- ============================================================
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


-- ============================================================
-- 004_audit_cookies.sql
-- ============================================================
-- 004 — audit_log, cookie_consents

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
-- en vanlig unique-constraint, så vi bruker to partielle unike indekser).
create unique index if not exists cookie_consents_user_uniq
  on public.cookie_consents(user_id) where user_id is not null;
create unique index if not exists cookie_consents_session_uniq
  on public.cookie_consents(session_id) where session_id is not null;


-- ============================================================
-- 005_rls_policies.sql
-- ============================================================
-- 005 — Row-Level Security
-- Aktiverer RLS og policyer på alle brukereide tabeller.
-- Service-role-klienten (admin) omgår RLS og brukes til webhooks,
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
-- properties  (inkl. feature-gating på antall eiendommer)
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
-- cookie_consents  (innloggede styrer egne; anonyme håndteres av admin)
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


-- ============================================================
-- 006_ical_sync.sql
-- ============================================================
-- 006 — toveis kalendersynk (iCal-import)
-- Kjør i Supabase SQL Editor. Idempotent.

-- Eksterne iCal-feeder å importere fra, som [{ "url": "...", "source": "airbnb" }]
alter table public.properties
  add column if not exists ical_urls jsonb not null default '[]'::jsonb;

-- UID fra eksternt VEVENT, for å unngå duplikater ved gjentatt import.
alter table public.bookings
  add column if not exists ical_uid text;

-- Én booking per (eiendom, ekstern UID).
create unique index if not exists bookings_property_ical_uid_uniq
  on public.bookings(property_id, ical_uid)
  where ical_uid is not null;


-- ============================================================
-- 007_seam_smartlock.sql
-- ============================================================
-- 007 — Seam smartlås (Nuki/Igloohome/Salto via aggregator)
-- Utvider smart_locks så den støtter Seam-tilkoblingsflyten.

-- Tillat flere leverandører enn nuki/yale/august (Seam dekker mange merker).
alter table public.smart_locks drop constraint if exists smart_locks_provider_check;

-- Seam holder selv låse-tokenet — vi trenger ikke lagre det.
alter table public.smart_locks alter column access_token_encrypted drop not null;

-- Nye felter for Seam-flyten.
alter table public.smart_locks add column if not exists connected_account_id text;
alter table public.smart_locks add column if not exists connect_webview_id text;

-- Tillat 'pending' mens eieren fullfører tilkoblingen i Connect Webview.
alter table public.smart_locks drop constraint if exists smart_locks_status_check;
alter table public.smart_locks add constraint smart_locks_status_check
  check (status in ('connected','error','disconnected','pending'));


-- ============================================================
-- 008_welcome_email.sql
-- ============================================================
-- 008 — Velkomst-e-post
-- Sporer at velkomst-e-posten sendes nøyaktig én gang per bruker.

alter table public.users
  add column if not exists welcomed_at timestamptz;


-- ============================================================
-- 009_access_info.sql
-- ============================================================
-- 009 — Tilkomstinfo og adgangskoder
-- Lar eiere uten smartlås legge inn nøkkelboks-/innsjekksinstruksjoner,
-- og lagrer auto-genererte smartlås-koder per booking.

alter table public.properties
  add column if not exists access_info text;

alter table public.bookings
  add column if not exists access_code text;
alter table public.bookings
  add column if not exists access_code_id text;


-- ============================================================
-- 010_guest_guide.sql
-- ============================================================
-- 010 — Digital gjesteguide
-- Gjesteinfo per eiendom + unik token per booking til den offentlige
-- gjestesiden (/gjest/[token]).

alter table public.properties
  add column if not exists wifi_name text;
alter table public.properties
  add column if not exists wifi_password text;
alter table public.properties
  add column if not exists house_rules text;
alter table public.properties
  add column if not exists checkout_info text;

alter table public.bookings
  add column if not exists guest_token uuid not null default gen_random_uuid();


-- ============================================================
-- 011_messages.sql
-- ============================================================
-- 011 — Gjestekommunikasjon (meldingslogg)
-- Logg over inn-/utgående meldinger per eiendom. RLS via owns_property.

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  booking_id  uuid references public.bookings(id) on delete set null,
  direction   text not null check (direction in ('incoming','outgoing')),
  channel     text not null default 'other'
                check (channel in ('airbnb','booking','whatsapp','sms','email','other')),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists messages_property_id_idx on public.messages(property_id);

alter table public.messages enable row level security;

drop policy if exists messages_select_own on public.messages;
create policy messages_select_own on public.messages
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists messages_insert_own on public.messages;
create policy messages_insert_own on public.messages
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists messages_delete_own on public.messages;
create policy messages_delete_own on public.messages
  for delete to authenticated using (public.owns_property(property_id));


-- ============================================================
-- 012_empty_date_alerts.sql
-- ============================================================
-- 012 — Tomme-dato-varsler
-- AI-drevne varsler om lavt belegg / store hull / nært forestående tomt.

create table if not exists public.empty_date_alerts (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  type          text not null
                  check (type in ('low_occupancy','large_gap','imminent_empty')),
  severity      text not null default 'normal'
                  check (severity in ('normal','warning','critical')),
  gap_start     date,
  gap_end       date,
  occupancy_pct int,
  message       text not null,
  status        text not null default 'pending'
                  check (status in ('pending','dismissed','resolved')),
  created_at    timestamptz not null default now()
);

create index if not exists empty_date_alerts_property_id_idx
  on public.empty_date_alerts(property_id);

alter table public.empty_date_alerts enable row level security;

drop policy if exists empty_date_alerts_select_own on public.empty_date_alerts;
create policy empty_date_alerts_select_own on public.empty_date_alerts
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists empty_date_alerts_insert_own on public.empty_date_alerts;
create policy empty_date_alerts_insert_own on public.empty_date_alerts
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists empty_date_alerts_update_own on public.empty_date_alerts;
create policy empty_date_alerts_update_own on public.empty_date_alerts
  for update to authenticated using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

drop policy if exists empty_date_alerts_delete_own on public.empty_date_alerts;
create policy empty_date_alerts_delete_own on public.empty_date_alerts
  for delete to authenticated using (public.owns_property(property_id));


-- ============================================================
-- 013_expenses.sql
-- ============================================================
-- 013 — Utgiftssporing → skatt
-- Fradragsberettigede utgifter per eiendom + utvider skatterapporten.

create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  category     text not null default 'other'
                 check (category in ('cleaning','maintenance','supplies','insurance','fee','utilities','other')),
  amount       numeric(10,2) not null,
  expense_date date not null,
  description  text,
  created_at   timestamptz not null default now()
);

create index if not exists expenses_property_id_idx on public.expenses(property_id);
create index if not exists expenses_date_idx on public.expenses(expense_date);

alter table public.expenses enable row level security;

drop policy if exists expenses_select_own on public.expenses;
create policy expenses_select_own on public.expenses
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists expenses_insert_own on public.expenses;
create policy expenses_insert_own on public.expenses
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists expenses_delete_own on public.expenses;
create policy expenses_delete_own on public.expenses
  for delete to authenticated using (public.owns_property(property_id));

-- Utvid skatterapporten med utgifter + netto utleieresultat.
alter table public.tax_reports add column if not exists total_expenses numeric(10,2);
alter table public.tax_reports add column if not exists net_income numeric(10,2);


-- ============================================================
-- 014_cleaning.sql
-- ============================================================
-- 014 — Rengjøring/turnover
-- Vaskere (token-basert portal) + rengjøringsoppgaver per eiendom/booking.

create table if not exists public.cleaners (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  access_token uuid not null default gen_random_uuid(),
  created_at   timestamptz not null default now()
);

create index if not exists cleaners_user_id_idx on public.cleaners(user_id);

alter table public.cleaners enable row level security;

drop policy if exists cleaners_select_own on public.cleaners;
create policy cleaners_select_own on public.cleaners
  for select to authenticated using (user_id = auth.uid());
drop policy if exists cleaners_insert_own on public.cleaners;
create policy cleaners_insert_own on public.cleaners
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists cleaners_update_own on public.cleaners;
create policy cleaners_update_own on public.cleaners
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists cleaners_delete_own on public.cleaners;
create policy cleaners_delete_own on public.cleaners
  for delete to authenticated using (user_id = auth.uid());

create table if not exists public.cleaning_tasks (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  booking_id  uuid references public.bookings(id) on delete set null,
  cleaner_id  uuid references public.cleaners(id) on delete set null,
  task_date   date not null,
  type        text not null default 'turnover'
                check (type in ('turnover','deep','periodic')),
  status      text not null default 'pending'
                check (status in ('pending','assigned','in_progress','completed')),
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists cleaning_tasks_property_id_idx on public.cleaning_tasks(property_id);
create index if not exists cleaning_tasks_cleaner_id_idx on public.cleaning_tasks(cleaner_id);
-- Én turnover-oppgave per booking (idempotent auto-generering).
create unique index if not exists cleaning_tasks_booking_uniq
  on public.cleaning_tasks(booking_id) where booking_id is not null;

alter table public.cleaning_tasks enable row level security;

drop policy if exists cleaning_tasks_select_own on public.cleaning_tasks;
create policy cleaning_tasks_select_own on public.cleaning_tasks
  for select to authenticated using (public.owns_property(property_id));
drop policy if exists cleaning_tasks_insert_own on public.cleaning_tasks;
create policy cleaning_tasks_insert_own on public.cleaning_tasks
  for insert to authenticated with check (public.owns_property(property_id));
drop policy if exists cleaning_tasks_update_own on public.cleaning_tasks;
create policy cleaning_tasks_update_own on public.cleaning_tasks
  for update to authenticated using (public.owns_property(property_id)) with check (public.owns_property(property_id));
drop policy if exists cleaning_tasks_delete_own on public.cleaning_tasks;
create policy cleaning_tasks_delete_own on public.cleaning_tasks
  for delete to authenticated using (public.owns_property(property_id));


-- ============================================================
-- 015_maintenance.sql
-- ============================================================
-- 015 — Vedlikeholdslogg
-- Saker per eiendom. Løses en sak med kostnad, opprettes automatisk en
-- utgiftspost (kategori 'maintenance') som mates inn i skatterapporten.

create table if not exists public.maintenance_requests (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'open'
                check (status in ('open','in_progress','resolved','cancelled')),
  priority    text not null default 'normal'
                check (priority in ('low','normal','high','urgent')),
  assignee    text,
  cost        numeric(10,2),
  expense_id  uuid references public.expenses(id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists maintenance_requests_property_id_idx
  on public.maintenance_requests(property_id);

alter table public.maintenance_requests enable row level security;

drop policy if exists maintenance_select_own on public.maintenance_requests;
create policy maintenance_select_own on public.maintenance_requests
  for select to authenticated using (public.owns_property(property_id));
drop policy if exists maintenance_insert_own on public.maintenance_requests;
create policy maintenance_insert_own on public.maintenance_requests
  for insert to authenticated with check (public.owns_property(property_id));
drop policy if exists maintenance_update_own on public.maintenance_requests;
create policy maintenance_update_own on public.maintenance_requests
  for update to authenticated using (public.owns_property(property_id)) with check (public.owns_property(property_id));
drop policy if exists maintenance_delete_own on public.maintenance_requests;
create policy maintenance_delete_own on public.maintenance_requests
  for delete to authenticated using (public.owns_property(property_id));


-- ============================================================
-- 016_supplies.sql
-- ============================================================
-- 016 — Lager / forbruksvarer
-- Forbruksvarer per eiendom med lavt-nivå-terskel for handleliste.

create table if not exists public.supplies (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  name          text not null,
  current_qty   int not null default 0,
  low_threshold int not null default 1,
  unit          text,
  created_at    timestamptz not null default now()
);

create index if not exists supplies_property_id_idx on public.supplies(property_id);

alter table public.supplies enable row level security;

drop policy if exists supplies_select_own on public.supplies;
create policy supplies_select_own on public.supplies
  for select to authenticated using (public.owns_property(property_id));
drop policy if exists supplies_insert_own on public.supplies;
create policy supplies_insert_own on public.supplies
  for insert to authenticated with check (public.owns_property(property_id));
drop policy if exists supplies_update_own on public.supplies;
create policy supplies_update_own on public.supplies
  for update to authenticated using (public.owns_property(property_id)) with check (public.owns_property(property_id));
drop policy if exists supplies_delete_own on public.supplies;
create policy supplies_delete_own on public.supplies
  for delete to authenticated using (public.owns_property(property_id));


-- ============================================================
-- 017_team_members.sql
-- ============================================================
-- 017 — Roller/team: co-host (les + drift)
-- En invitert co-host logger inn og får drifte eierens eiendommer (bookinger,
-- oppgaver, meldinger osv.) — men ikke abonnement, sletting eller nye eiendommer.

create table if not exists public.team_members (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null references public.users(id) on delete cascade,
  member_email   text not null,
  member_user_id uuid references public.users(id) on delete set null,
  role           text not null default 'co_host' check (role in ('co_host')),
  invite_token   uuid not null default gen_random_uuid(),
  accepted_at    timestamptz,
  created_at     timestamptz not null default now(),
  unique (owner_user_id, member_email)
);

create index if not exists team_members_owner_idx on public.team_members(owner_user_id);
create index if not exists team_members_member_idx on public.team_members(member_user_id);

alter table public.team_members enable row level security;

-- Eieren administrerer eget team.
drop policy if exists team_members_owner_all on public.team_members;
create policy team_members_owner_all on public.team_members
  for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Medlemmet kan se egne medlemskap.
drop policy if exists team_members_member_select on public.team_members;
create policy team_members_member_select on public.team_members
  for select to authenticated using (member_user_id = auth.uid());

-- =========================================================================
-- Er innlogget bruker et akseptert teammedlem hos denne eieren?
-- =========================================================================
create or replace function public.is_account_member(p_owner uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.owner_user_id = p_owner
      and tm.member_user_id = auth.uid()
      and tm.accepted_at is not null
  );
$$;

-- =========================================================================
-- Utvid owns_property: eier ELLER akseptert co-host. Kaskaderer til alle
-- tabeller som bruker funksjonen (bookings, smart_locks, expenses, messages,
-- cleaning_tasks, maintenance_requests, supplies, empty_date_alerts, boosts).
-- =========================================================================
create or replace function public.owns_property(p_property_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.properties p
    where p.id = p_property_id
      and (
        p.user_id = auth.uid()
        or public.is_account_member(p.user_id)
      )
  );
$$;

-- La co-host se eierens eiendommer (oppretting/sletting forblir eier-only).
drop policy if exists properties_select_own on public.properties;
create policy properties_select_own on public.properties
  for select to authenticated
  using (user_id = auth.uid() or public.is_account_member(user_id));


-- ============================================================
-- 018_social_channels.sql
-- ============================================================
-- 018 — Verta sosiale kanaler
-- Plattform-nivå tabell for Vertas egne sosiale kontoer + publiseringsfelter
-- på boosts. Kun service-role (admin) har tilgang — ingen vanlig bruker.

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique,
  handle text,
  status text not null default 'connected',
  external_ref text,
  access_token_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_accounts_status_check
    check (status in ('connected','manual','disconnected'))
);

-- RLS på: ingen policy = kun service-role (admin-klient) slipper til.
alter table public.social_accounts enable row level security;

-- Publiseringsstatus på boosts (for kø + sporing).
alter table public.boosts add column if not exists published_at timestamptz;
alter table public.boosts add column if not exists published_url text;


-- ============================================================
-- 019_cleaning_market.sql
-- ============================================================
-- 019 — Vaske-marked (M1: tilgjengelighet + posisjon)
-- Lar vaskere gjøre seg synlige for andre eiere, og matcher på avstand.

alter table public.cleaners
  add column if not exists available_for_hire boolean not null default false;
alter table public.cleaners
  add column if not exists max_travel_km int;
alter table public.cleaners
  add column if not exists hourly_rate numeric(10,2);
alter table public.cleaners
  add column if not exists bio text;
alter table public.cleaners
  add column if not exists base_address text;
alter table public.cleaners
  add column if not exists lat double precision;
alter table public.cleaners
  add column if not exists lng double precision;

-- Posisjon på eiendommer (geokodet fra adresse) for avstandsmatch.
alter table public.properties
  add column if not exists lat double precision;
alter table public.properties
  add column if not exists lng double precision;


-- ============================================================
-- 020_service_requests.sql
-- ============================================================
-- 020 — Vaske-marked (M2: forespørsler)
-- Eier sender forespørsel til en vasker; vaskeren godtar/avslår i portalen.

create table if not exists public.service_requests (
  id                uuid primary key default gen_random_uuid(),
  cleaner_id        uuid not null references public.cleaners(id) on delete cascade,
  property_id       uuid not null references public.properties(id) on delete cascade,
  requester_user_id uuid not null references public.users(id) on delete cascade,
  job_date          date,
  message           text,
  status            text not null default 'pending'
                      check (status in ('pending','accepted','declined','cancelled')),
  created_at        timestamptz not null default now(),
  responded_at      timestamptz
);

create index if not exists service_requests_cleaner_idx on public.service_requests(cleaner_id);
create index if not exists service_requests_requester_idx on public.service_requests(requester_user_id);

alter table public.service_requests enable row level security;

-- Eier (forespørrer) styrer egne forespørsler. Vaskeren svarer via portal-token
-- (admin-klient), så den trenger ingen egen policy her.
drop policy if exists service_requests_select_own on public.service_requests;
create policy service_requests_select_own on public.service_requests
  for select to authenticated using (requester_user_id = auth.uid());

drop policy if exists service_requests_insert_own on public.service_requests;
create policy service_requests_insert_own on public.service_requests
  for insert to authenticated
  with check (requester_user_id = auth.uid() and public.owns_property(property_id));

drop policy if exists service_requests_update_own on public.service_requests;
create policy service_requests_update_own on public.service_requests
  for update to authenticated using (requester_user_id = auth.uid())
  with check (requester_user_id = auth.uid());


-- ============================================================
-- 021_cleaner_reviews.sql
-- ============================================================
-- 021 — Vaske-marked (M3: vurderinger)
-- Eier som har hatt et godtatt oppdrag kan gi vaskeren en vurdering.

create table if not exists public.cleaner_reviews (
  id               uuid primary key default gen_random_uuid(),
  cleaner_id       uuid not null references public.cleaners(id) on delete cascade,
  reviewer_user_id uuid not null references public.users(id) on delete cascade,
  property_id      uuid references public.properties(id) on delete set null,
  rating           int not null check (rating between 1 and 5),
  comment          text,
  created_at       timestamptz not null default now(),
  unique (cleaner_id, reviewer_user_id)
);

create index if not exists cleaner_reviews_cleaner_idx on public.cleaner_reviews(cleaner_id);

alter table public.cleaner_reviews enable row level security;

-- Vurdereren styrer egne vurderinger. Markedsplassen leser snitt via admin-klient.
drop policy if exists cleaner_reviews_own on public.cleaner_reviews;
create policy cleaner_reviews_own on public.cleaner_reviews
  for all to authenticated
  using (reviewer_user_id = auth.uid())
  with check (reviewer_user_id = auth.uid());


-- ============================================================
-- 022_service_payments.sql
-- ============================================================
-- 022 — Vaske-marked (M4: pris + Verta-gebyr + betalingsstatus)
-- Avtalt pris på et oppdrag, Verta sitt formidlingsgebyr, og betalingsstatus.

alter table public.service_requests
  add column if not exists amount numeric(10,2);
alter table public.service_requests
  add column if not exists verta_fee numeric(10,2);
alter table public.service_requests
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid'));


-- ============================================================
-- 023_pricing.sql
-- ============================================================
-- 023 — Lagret prising → automatiske bookingtotaler
-- Basepris + rengjøringsgebyr per eiendom, og sesongpriser som overstyrer
-- baseprisen for gitte datointervaller. Booking-totaler beregnes fra disse.
-- Kjør i Supabase SQL Editor. Idempotent (kan kjøres på nytt).

-- Prisfelt på eiendom.
alter table public.properties
  add column if not exists base_nightly_rate numeric(10,2);
alter table public.properties
  add column if not exists cleaning_fee numeric(10,2);

-- =========================================================================
-- seasonal_rates — overstyrer baseprisen for et datointervall (per natt)
-- =========================================================================
create table if not exists public.seasonal_rates (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  name         text not null,
  date_from    date not null,
  date_to      date not null,
  nightly_rate numeric(10,2) not null,
  created_at   timestamptz not null default now(),
  constraint seasonal_rates_valid_dates check (date_to >= date_from)
);

create index if not exists seasonal_rates_property_id_idx
  on public.seasonal_rates(property_id);

alter table public.seasonal_rates enable row level security;

drop policy if exists seasonal_rates_select_own on public.seasonal_rates;
create policy seasonal_rates_select_own on public.seasonal_rates
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists seasonal_rates_insert_own on public.seasonal_rates;
create policy seasonal_rates_insert_own on public.seasonal_rates
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists seasonal_rates_update_own on public.seasonal_rates;
create policy seasonal_rates_update_own on public.seasonal_rates
  for update to authenticated using (public.owns_property(property_id));

drop policy if exists seasonal_rates_delete_own on public.seasonal_rates;
create policy seasonal_rates_delete_own on public.seasonal_rates
  for delete to authenticated using (public.owns_property(property_id));


-- ============================================================
-- 024_contractors.sql
-- ============================================================
-- 024 — Håndverkere (token-basert portal)
-- Eier registrerer håndverkere og tildeler dem vedlikeholdssaker. Håndverkeren
-- får en egen lenke (som vaskerne) der hen ser og oppdaterer sine egne saker —
-- uten innlogging. Kjør i Supabase SQL Editor. Idempotent.

create table if not exists public.contractors (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  trade        text,                       -- fag, f.eks. rørlegger/elektriker
  access_token uuid not null default gen_random_uuid(),
  created_at   timestamptz not null default now()
);

create index if not exists contractors_user_id_idx on public.contractors(user_id);

alter table public.contractors enable row level security;

drop policy if exists contractors_select_own on public.contractors;
create policy contractors_select_own on public.contractors
  for select to authenticated using (user_id = auth.uid());
drop policy if exists contractors_insert_own on public.contractors;
create policy contractors_insert_own on public.contractors
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists contractors_update_own on public.contractors;
create policy contractors_update_own on public.contractors
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists contractors_delete_own on public.contractors;
create policy contractors_delete_own on public.contractors
  for delete to authenticated using (user_id = auth.uid());

-- Koble en vedlikeholdssak til en håndverker.
alter table public.maintenance_requests
  add column if not exists contractor_id uuid
    references public.contractors(id) on delete set null;

create index if not exists maintenance_requests_contractor_id_idx
  on public.maintenance_requests(contractor_id);


-- ============================================================
-- 025_cleaning_photos.sql
-- ============================================================
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


-- ============================================================
-- 026_cleaning_clock.sql
-- ============================================================
-- 026 — GPS-stempling for vaskere
-- Vaskeren stempler inn/ut på en oppgave med tidspunkt + posisjon, så eieren
-- kan se når og hvor jobben ble gjort. Kjør i Supabase SQL Editor. Idempotent.

alter table public.cleaning_tasks
  add column if not exists clock_in_at   timestamptz;
alter table public.cleaning_tasks
  add column if not exists clock_in_lat   numeric(9,6);
alter table public.cleaning_tasks
  add column if not exists clock_in_lng   numeric(9,6);
alter table public.cleaning_tasks
  add column if not exists clock_out_at  timestamptz;
alter table public.cleaning_tasks
  add column if not exists clock_out_lat  numeric(9,6);
alter table public.cleaning_tasks
  add column if not exists clock_out_lng  numeric(9,6);


-- ============================================================
-- 027_guest_payments.sql
-- ============================================================
-- 027 — Gjeste-betaling (Stripe Connect) + dobbeltbooking-sperre
-- Legger til utbetalingsfelt på eier (Connect), betalingsfelt på booking,
-- en ny `pending`-status (holdt, ikke betalt ennå), og en database-nivå
-- EXCLUDE-constraint som fysisk hindrer overlappende bookinger.
-- Kjør i Supabase SQL Editor. Idempotent (kan kjøres på nytt).

-- Kreves av EXCLUDE-constrainten under (gist på scalar + range).
create extension if not exists btree_gist;

-- =========================================================================
-- users — Stripe Connect (utbetaling til eier)
-- =========================================================================
-- Eierens tilkoblede Stripe-konto (Express). Skilt fra stripe_customer_id,
-- som kun gjelder eierens eget abonnement.
alter table public.users
  add column if not exists stripe_connect_id text;
-- true når Connect-kontoen er ferdig onboardet og kan motta utbetalinger
-- (speiler Stripe sin charges_enabled/payouts_enabled via account.updated).
alter table public.users
  add column if not exists payouts_enabled boolean not null default false;

-- =========================================================================
-- bookings — betalingsfelt
-- =========================================================================
-- null  = ingen betaling gjennom Verta (off-platform / importert fra Airbnb/Booking)
-- pending = checkout startet, venter på betaling
-- paid    = betalt
-- refunded/failed = selvforklarende
alter table public.bookings
  add column if not exists payment_status text
    check (payment_status in ('pending','paid','refunded','failed'));
alter table public.bookings
  add column if not exists stripe_session_id text;
alter table public.bookings
  add column if not exists stripe_payment_intent text;
-- Totalbeløp gjesten belastes (kroner). Speiler total_price ved betaling.
alter table public.bookings
  add column if not exists amount_total numeric(10,2);
-- Vertas kutt (application_fee) på denne bookingen.
alter table public.bookings
  add column if not exists application_fee numeric(10,2);
-- Midlertidig reservasjon: en pending booking holder datoene til dette
-- tidspunktet. Utløper checkout uten betaling, frigis holdet (→ cancelled).
alter table public.bookings
  add column if not exists hold_expires_at timestamptz;

-- Rask oppslag fra webhooks (checkout.session.completed / payment_intent.*).
create index if not exists bookings_stripe_session_idx
  on public.bookings(stripe_session_id)
  where stripe_session_id is not null;
create index if not exists bookings_stripe_payment_intent_idx
  on public.bookings(stripe_payment_intent)
  where stripe_payment_intent is not null;
-- For cron som rydder utløpte hold.
create index if not exists bookings_hold_expires_idx
  on public.bookings(hold_expires_at)
  where status = 'pending';

-- =========================================================================
-- bookings.status — legg til 'pending' (holdt, ikke betalt)
-- =========================================================================
-- Constrainten er definert inline i 001 (auto-navn bookings_status_check) og
-- aldri endret siden. Trygt å droppe og gjenskape med den nye verdien.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('confirmed','cancelled','completed','pending'));

-- =========================================================================
-- Dobbeltbooking-sperre — databasen nekter fysisk overlapp
-- =========================================================================
-- Half-open datointervall [check_in, check_out): utsjekk-dagen teller ikke som
-- opptatt, så en ny gjest kan sjekke inn samme dag som forrige sjekker ut.
-- Gjelder alle ikke-kansellerte bookinger (også pending hold).
-- Legges til beskyttet: om eksisterende data allerede overlapper, hopper vi
-- over med en beskjed i stedet for å feile hele migrasjonen.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_overlap'
  ) then
    begin
      alter table public.bookings
        add constraint bookings_no_overlap
        exclude using gist (
          property_id with =,
          daterange(check_in, check_out, '[)') with &&
        ) where (status <> 'cancelled');
    exception when exclusion_violation then
      raise notice 'bookings_no_overlap ikke lagt til: eksisterende overlappende bookinger finnes. Rydd opp i overlapp og kjør migrasjonen på nytt.';
    end;
  end if;
end $$;


-- ============================================================
-- 028_request_booking.sql
-- ============================================================
-- 028 — Forespørsel-booking: godkjenning, depositum, gjeste-info
-- Per-eiendom kan eier velge 'instant' (bestill+betal med en gang) eller
-- 'request' (gjest sender forespørsel → eier godkjenner → depositum låser).
-- Kjør i Supabase SQL Editor. Idempotent (kan kjøres på nytt).

-- =========================================================================
-- properties — bookingmodus
-- =========================================================================
alter table public.properties
  add column if not exists booking_mode text not null default 'instant'
    check (booking_mode in ('instant', 'request'));

-- =========================================================================
-- bookings — nye statuser + gjeste-info + depositum/rest
-- =========================================================================
-- requested = forespørsel (låser IKKE datoene), approved = godkjent (venter
-- depositum, datoene holdes 24t). Constrainten ble sist satt i 027.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in (
    'confirmed', 'cancelled', 'completed', 'pending', 'requested', 'approved'
  ));

-- Gjeste-info for eiers vurdering.
alter table public.bookings add column if not exists num_guests int;
alter table public.bookings add column if not exists guest_message text;
alter table public.bookings add column if not exists approved_at timestamptz;

-- Depositum (betales ved godkjenning) + restbeløp (betales før innsjekk).
alter table public.bookings add column if not exists deposit_amount numeric(10,2);
alter table public.bookings add column if not exists remaining_amount numeric(10,2);
alter table public.bookings
  add column if not exists remaining_paid boolean not null default false;
alter table public.bookings add column if not exists remaining_session_id text;
alter table public.bookings
  add column if not exists remaining_payment_intent text;

create index if not exists bookings_remaining_session_idx
  on public.bookings(remaining_session_id)
  where remaining_session_id is not null;

-- =========================================================================
-- Dobbeltbooking-sperre — forespørsler skal IKKE låse datoene
-- =========================================================================
-- Flere gjester kan forespørre samme dato; eier velger én. Først når en booking
-- er godkjent/holdt/bekreftet låses datoene. Utvider derfor unntaket fra 027 til
-- også å gjelde 'requested'.
alter table public.bookings drop constraint if exists bookings_no_overlap;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_overlap'
  ) then
    begin
      alter table public.bookings
        add constraint bookings_no_overlap
        exclude using gist (
          property_id with =,
          daterange(check_in, check_out, '[)') with &&
        ) where (status not in ('cancelled', 'requested'));
    exception when exclusion_violation then
      raise notice 'bookings_no_overlap ikke lagt til: eksisterende overlapp finnes. Rydd opp og kjør på nytt.';
    end;
  end if;
end $$;


-- ============================================================
-- 029_remaining_reminder.sql
-- ============================================================
-- 029 — Restbetaling: påminnelse-flagg
-- Sporer når restbetalings-påminnelsen ble sendt, så cronen ikke sender den
-- på nytt hver dag. Kjør i Supabase SQL Editor. Idempotent.

alter table public.bookings
  add column if not exists remaining_reminded_at timestamptz;


-- ============================================================
-- 030_remaining_deadline.sql
-- ============================================================
-- 030 — Restbetaling: varsel-trinn (48t/24t før frist)
-- Sporer hvor langt i varslingsløpet en booking har kommet, så cronen ikke
-- sender samme varsel to ganger. 0 = ingen, 1 = 48t-varsel sendt, 2 = 24t sendt.
-- Kjør i Supabase SQL Editor. Idempotent.

alter table public.bookings
  add column if not exists remaining_warn_stage smallint not null default 0;


-- ============================================================
-- 031_property_images.sql
-- ============================================================
-- 031 — Eiendomsbilder: offentlig Storage-bucket
-- Bildene vises på den offentlige booking-siden, så bucketen er public (lesing).
-- Opplasting/sletting skjer via service-role i server actions, så det trengs
-- ingen egne RLS-policyer. Kjør i Supabase SQL Editor. Idempotent.

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update set public = true;


-- ============================================================
-- 032_property_details.sql
-- ============================================================
-- 032 — Eiendomsdetaljer: fasiliteter, soveplasser, innsjekk-/utsjekktider
-- Beriker den offentlige booking-siden (Airbnb-lignende). Kjør i Supabase SQL
-- Editor. Idempotent. Kart bruker eksisterende lat/lng (ingen nye felter).

alter table public.properties
  add column if not exists amenities text[] not null default '{}';
alter table public.properties
  add column if not exists beds int;
alter table public.properties
  add column if not exists sleeping_arrangements text;
alter table public.properties
  add column if not exists check_in_time text;
alter table public.properties
  add column if not exists check_out_time text;


-- ============================================================
-- 033_property_finance.sql
-- ============================================================
-- 033 — Eiendomsfinans: verdi, lån, rente, avdrag
-- Grunnlaget for balanse/egenkapital/belåningsgrad/renter i Eiendomsøkonomi.
-- Kjør i Supabase SQL Editor. Idempotent.

alter table public.properties
  add column if not exists market_value numeric(12,2);
alter table public.properties
  add column if not exists loan_amount numeric(12,2);
alter table public.properties
  add column if not exists interest_rate numeric(5,2);
alter table public.properties
  add column if not exists monthly_principal numeric(10,2);


-- ============================================================
-- 034_owners.sql
-- ============================================================
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


-- ============================================================
-- 035_property_events.sql
-- ============================================================
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


-- ============================================================
-- 036_public_listing.sql
-- ============================================================
-- 036 — Offentlig boligvisning (/bo/[slug])
-- AI-generert annonsetekst + områdebeskrivelse. Genereres én gang og caches,
-- så den offentlige siden slipper å kalle AI ved hvert besøk. Idempotent.
alter table public.properties
  add column if not exists public_listing text;

alter table public.properties
  add column if not exists area_description text;


-- ============================================================
-- 037_public_media_pois.sql
-- ============================================================
-- 037 — Offentlig boligvisning Fase 2
-- video_url:      valgfri hero-video (mp4/webm) på /bo/[slug]
-- nearby_pois:    cachede nærliggende steder (Overpass/OSM), se lib/pois.ts
-- travel_guide:   cachet AI-reiseguide vist på gjestesiden etter booking
-- Idempotent.
alter table public.properties
  add column if not exists video_url text;

alter table public.properties
  add column if not exists nearby_pois jsonb;

alter table public.properties
  add column if not exists travel_guide text;

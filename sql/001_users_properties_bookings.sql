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

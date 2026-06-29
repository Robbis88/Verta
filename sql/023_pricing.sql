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

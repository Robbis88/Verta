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

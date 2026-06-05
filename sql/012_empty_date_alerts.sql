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

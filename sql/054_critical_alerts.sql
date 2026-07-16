-- 054 — Lokale kritiske varsler for dashbordet (refusjons-svikt, foreldreløse
-- betalinger). loggHendelse går til det eksterne kontrollrommet; dette gir et
-- lokalt, kvitterbart varsel til eier/admin i selve appen.

create table if not exists public.critical_alerts (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null,                 -- 'refund_failed' | 'orphan_payment'
  title       text not null,
  details     jsonb not null default '{}'::jsonb,
  property_id uuid references public.properties(id) on delete set null, -- null = plattform-nivå (admin)
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists critical_alerts_open_idx
  on public.critical_alerts (resolved, created_at desc);

alter table public.critical_alerts enable row level security;

-- Eier ser og kvitterer alarmer knyttet til egne eiendommer. Plattform-alarmer
-- (property_id null) håndteres av admin via service-role (admin-klient).
drop policy if exists critical_alerts_owner_select on public.critical_alerts;
create policy critical_alerts_owner_select on public.critical_alerts
  for select to authenticated
  using (property_id is not null and public.owns_property(property_id));

drop policy if exists critical_alerts_owner_update on public.critical_alerts;
create policy critical_alerts_owner_update on public.critical_alerts
  for update to authenticated
  using (property_id is not null and public.owns_property(property_id))
  with check (property_id is not null and public.owns_property(property_id));

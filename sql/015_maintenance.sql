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

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

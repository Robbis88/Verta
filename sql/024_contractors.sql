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

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

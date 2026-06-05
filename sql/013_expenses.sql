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

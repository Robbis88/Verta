-- 049 — Utstyrsutleie i gjesteguiden (sykler, ski, kajakk osv.)
-- Utleieren lister utstyr; gjesten leier og betaler under oppholdet. Betaling er
-- destination charge (platform) med 10 % Verta-gebyr, resten til eierens konto.

create table if not exists public.rental_items (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name        text not null,
  description text,
  price       numeric not null check (price >= 0),
  quantity    int not null default 1,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.rental_orders (
  id                uuid primary key default gen_random_uuid(),
  item_id           uuid references public.rental_items(id) on delete set null,
  property_id       uuid not null references public.properties(id) on delete cascade,
  guest_name        text not null,
  guest_contact     text,
  quantity          int not null default 1,
  amount            numeric not null,
  verta_fee         numeric not null,
  status            text not null default 'pending', -- pending | paid | cancelled
  stripe_session_id text,
  created_at        timestamptz not null default now()
);

create index if not exists rental_items_property_idx
  on public.rental_items (property_id);
create index if not exists rental_orders_property_idx
  on public.rental_orders (property_id, created_at desc);

alter table public.rental_items enable row level security;
alter table public.rental_orders enable row level security;

-- Eier styrer eget utstyr; gjeste-innlegging + betaling går via service-role.
drop policy if exists rental_items_owner on public.rental_items;
create policy rental_items_owner on public.rental_items
  for all to authenticated
  using (public.owns_property(property_id))
  with check (public.owns_property(property_id));

drop policy if exists rental_orders_owner on public.rental_orders;
create policy rental_orders_owner on public.rental_orders
  for select to authenticated
  using (public.owns_property(property_id));

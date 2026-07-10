-- 038 — Gjeste-anmeldelser på boligen (vises på /bo/[slug])
-- Innlegging + offentlig visning går via service-role (server actions), så vi
-- trenger ingen anon-policyer. Eier kan se og svare på egne anmeldelser.
create table if not exists public.property_reviews (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  booking_id  uuid references public.bookings(id) on delete set null,
  guest_name  text not null,
  rating      int  not null check (rating between 1 and 5),
  comment     text,
  owner_reply text,
  created_at  timestamptz not null default now()
);

create index if not exists property_reviews_property_idx
  on public.property_reviews (property_id, created_at desc);

-- Én anmeldelse per booking.
create unique index if not exists property_reviews_booking_uniq
  on public.property_reviews (booking_id)
  where booking_id is not null;

alter table public.property_reviews enable row level security;

drop policy if exists property_reviews_select_own on public.property_reviews;
create policy property_reviews_select_own on public.property_reviews
  for select to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );

drop policy if exists property_reviews_update_own on public.property_reviews;
create policy property_reviews_update_own on public.property_reviews
  for update to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.user_id = auth.uid()
    )
  );

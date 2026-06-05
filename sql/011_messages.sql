-- 011 — Gjestekommunikasjon (meldingslogg)
-- Logg over inn-/utgående meldinger per eiendom. RLS via owns_property.

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  booking_id  uuid references public.bookings(id) on delete set null,
  direction   text not null check (direction in ('incoming','outgoing')),
  channel     text not null default 'other'
                check (channel in ('airbnb','booking','whatsapp','sms','email','other')),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists messages_property_id_idx on public.messages(property_id);

alter table public.messages enable row level security;

drop policy if exists messages_select_own on public.messages;
create policy messages_select_own on public.messages
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists messages_insert_own on public.messages;
create policy messages_insert_own on public.messages
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists messages_delete_own on public.messages;
create policy messages_delete_own on public.messages
  for delete to authenticated using (public.owns_property(property_id));

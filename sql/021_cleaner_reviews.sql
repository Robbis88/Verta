-- 021 — Vaske-marked (M3: vurderinger)
-- Eier som har hatt et godtatt oppdrag kan gi vaskeren en vurdering.

create table if not exists public.cleaner_reviews (
  id               uuid primary key default gen_random_uuid(),
  cleaner_id       uuid not null references public.cleaners(id) on delete cascade,
  reviewer_user_id uuid not null references public.users(id) on delete cascade,
  property_id      uuid references public.properties(id) on delete set null,
  rating           int not null check (rating between 1 and 5),
  comment          text,
  created_at       timestamptz not null default now(),
  unique (cleaner_id, reviewer_user_id)
);

create index if not exists cleaner_reviews_cleaner_idx on public.cleaner_reviews(cleaner_id);

alter table public.cleaner_reviews enable row level security;

-- Vurdereren styrer egne vurderinger. Markedsplassen leser snitt via admin-klient.
drop policy if exists cleaner_reviews_own on public.cleaner_reviews;
create policy cleaner_reviews_own on public.cleaner_reviews
  for all to authenticated
  using (reviewer_user_id = auth.uid())
  with check (reviewer_user_id = auth.uid());

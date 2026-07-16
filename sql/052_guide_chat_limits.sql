-- 052 — Rate limiting for gjeste-AI-chatten (personvernvennlig: kun tellere).
-- Lagrer ingen meldingsinnhold — bare antall treff per guide-token per tidsvindu
-- (minutt og døgn), så én gjest ikke kan spamme opp Anthropic-kostnaden.

create table if not exists public.guide_chat_limits (
  guide_token uuid not null,
  bucket      text not null,   -- «2026-07-16» (døgn) eller «2026-07-16T14:03» (minutt)
  count       int not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (guide_token, bucket)
);

-- Kun service-role (admin-klient) skriver/leser. RLS på uten policy = stengt
-- for vanlige innloggede brukere.
alter table public.guide_chat_limits enable row level security;

-- Atomisk «øk telleren og returner ny verdi».
create or replace function public.bump_guide_limit(p_token uuid, p_bucket text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  c int;
begin
  insert into public.guide_chat_limits (guide_token, bucket, count)
    values (p_token, p_bucket, 1)
  on conflict (guide_token, bucket)
    do update set count = guide_chat_limits.count + 1, updated_at = now()
  returning count into c;
  return c;
end;
$$;

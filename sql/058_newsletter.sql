-- 058 — Nyhetsbrev-påmelding med samtykke + avmelding (GDPR).
-- E-post lagres kun med aktivt samtykke (consent_at). Avmelding via egen token.
-- Kun super-admin leser (via service-role); ingen authenticated-policy.

create table if not exists public.newsletter_subscribers (
  id                uuid primary key default gen_random_uuid(),
  email             text not null unique,        -- alltid lagret i lowercase
  name              text,
  source            text,                          -- 'guide' | 'owner' | 'guest' …
  consent_at        timestamptz not null default now(),
  unsubscribed_at   timestamptz,                   -- satt = avmeldt
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at        timestamptz not null default now()
);

create unique index if not exists newsletter_unsub_token_idx
  on public.newsletter_subscribers (unsubscribe_token);
create index if not exists newsletter_active_idx
  on public.newsletter_subscribers (unsubscribed_at, created_at desc);

alter table public.newsletter_subscribers enable row level security;
-- Ingen policy: kun service-role (admin-klient / server actions) leser og skriver.

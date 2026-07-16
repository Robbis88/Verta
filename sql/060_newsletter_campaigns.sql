-- 060 — Logg over sendte nyhetsbrev-kampanjer (revisjon: hva ble sendt, til hvor
-- mange, når). Kun super-admin (service-role) leser/skriver.

create table if not exists public.newsletter_campaigns (
  id              uuid primary key default gen_random_uuid(),
  subject         text not null,
  body            text not null,
  recipient_count int not null default 0,
  sent_count      int not null default 0,
  created_by      text,
  created_at      timestamptz not null default now()
);

create index if not exists newsletter_campaigns_created_idx
  on public.newsletter_campaigns (created_at desc);

alter table public.newsletter_campaigns enable row level security;
-- Ingen policy: kun service-role.

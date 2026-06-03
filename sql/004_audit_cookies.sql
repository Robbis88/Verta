-- 004 — audit_log, cookie_consents

-- =========================================================================
-- audit_log  (append-only)
-- =========================================================================
create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  action        text not null,
  resource_type text,
  resource_id   uuid,
  changes       jsonb,
  severity      text not null default 'info'
                  check (severity in ('info','warning','security')),
  ip_address    inet,
  created_at    timestamptz not null default now()
);

create index if not exists audit_log_user_id_idx on public.audit_log(user_id);
create index if not exists audit_log_created_at_idx on public.audit_log(created_at);

-- =========================================================================
-- cookie_consents  (GDPR)
-- =========================================================================
create table if not exists public.cookie_consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  session_id  text,                                  -- for ikke-innloggede
  analytics   boolean not null default false,
  marketing   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Unikhet per bruker ELLER per session (kan ikke uttrykkes med coalesce i
-- en vanlig unique-constraint, så vi bruker to partielle unike indekser).
create unique index if not exists cookie_consents_user_uniq
  on public.cookie_consents(user_id) where user_id is not null;
create unique index if not exists cookie_consents_session_uniq
  on public.cookie_consents(session_id) where session_id is not null;

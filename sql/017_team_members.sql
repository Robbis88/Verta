-- 017 — Roller/team: co-host (les + drift)
-- En invitert co-host logger inn og får drifte eierens eiendommer (bookinger,
-- oppgaver, meldinger osv.) — men ikke abonnement, sletting eller nye eiendommer.

create table if not exists public.team_members (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null references public.users(id) on delete cascade,
  member_email   text not null,
  member_user_id uuid references public.users(id) on delete set null,
  role           text not null default 'co_host' check (role in ('co_host')),
  invite_token   uuid not null default gen_random_uuid(),
  accepted_at    timestamptz,
  created_at     timestamptz not null default now(),
  unique (owner_user_id, member_email)
);

create index if not exists team_members_owner_idx on public.team_members(owner_user_id);
create index if not exists team_members_member_idx on public.team_members(member_user_id);

alter table public.team_members enable row level security;

-- Eieren administrerer eget team.
drop policy if exists team_members_owner_all on public.team_members;
create policy team_members_owner_all on public.team_members
  for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Medlemmet kan se egne medlemskap.
drop policy if exists team_members_member_select on public.team_members;
create policy team_members_member_select on public.team_members
  for select to authenticated using (member_user_id = auth.uid());

-- =========================================================================
-- Er innlogget bruker et akseptert teammedlem hos denne eieren?
-- =========================================================================
create or replace function public.is_account_member(p_owner uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.owner_user_id = p_owner
      and tm.member_user_id = auth.uid()
      and tm.accepted_at is not null
  );
$$;

-- =========================================================================
-- Utvid owns_property: eier ELLER akseptert co-host. Kaskaderer til alle
-- tabeller som bruker funksjonen (bookings, smart_locks, expenses, messages,
-- cleaning_tasks, maintenance_requests, supplies, empty_date_alerts, boosts).
-- =========================================================================
create or replace function public.owns_property(p_property_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.properties p
    where p.id = p_property_id
      and (
        p.user_id = auth.uid()
        or public.is_account_member(p.user_id)
      )
  );
$$;

-- La co-host se eierens eiendommer (oppretting/sletting forblir eier-only).
drop policy if exists properties_select_own on public.properties;
create policy properties_select_own on public.properties
  for select to authenticated
  using (user_id = auth.uid() or public.is_account_member(user_id));

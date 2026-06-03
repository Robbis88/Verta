-- 005 — Row-Level Security
-- Aktiverer RLS og policyer på alle brukereide tabeller.
-- Service-role-klienten (admin) omgår RLS og brukes til webhooks,
-- offentlige direkte-bookinger og audit-logging.

-- =========================================================================
-- users
-- =========================================================================
alter table public.users enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select to authenticated using (id = auth.uid());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- INSERT skjer via handle_new_user()-triggeren (security definer).

-- =========================================================================
-- properties  (inkl. feature-gating på antall eiendommer)
-- =========================================================================
alter table public.properties enable row level security;

drop policy if exists properties_select_own on public.properties;
create policy properties_select_own on public.properties
  for select to authenticated using (user_id = auth.uid());

drop policy if exists properties_insert_own on public.properties;
create policy properties_insert_own on public.properties
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      (select count(*) from public.properties where user_id = auth.uid())
      <
      case
        when (select plan from public.users where id = auth.uid()) = 'premium'
          then 1 + coalesce((select extra_properties_count from public.users where id = auth.uid()), 0)
        else 1
      end
    )
  );

drop policy if exists properties_update_own on public.properties;
create policy properties_update_own on public.properties
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists properties_delete_own on public.properties;
create policy properties_delete_own on public.properties
  for delete to authenticated using (user_id = auth.uid());

-- =========================================================================
-- Hjelper: eier en bruker eiendommen bak denne raden?
-- =========================================================================
create or replace function public.owns_property(p_property_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.properties
    where id = p_property_id and user_id = auth.uid()
  );
$$;

-- =========================================================================
-- bookings  (eid via property)
-- =========================================================================
alter table public.bookings enable row level security;

drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own on public.bookings
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists bookings_insert_own on public.bookings;
create policy bookings_insert_own on public.bookings
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists bookings_update_own on public.bookings;
create policy bookings_update_own on public.bookings
  for update to authenticated using (public.owns_property(property_id)) with check (public.owns_property(property_id));

drop policy if exists bookings_delete_own on public.bookings;
create policy bookings_delete_own on public.bookings
  for delete to authenticated using (public.owns_property(property_id));

-- =========================================================================
-- boosts  (eid via property)
-- =========================================================================
alter table public.boosts enable row level security;

drop policy if exists boosts_select_own on public.boosts;
create policy boosts_select_own on public.boosts
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists boosts_insert_own on public.boosts;
create policy boosts_insert_own on public.boosts
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists boosts_update_own on public.boosts;
create policy boosts_update_own on public.boosts
  for update to authenticated using (public.owns_property(property_id)) with check (public.owns_property(property_id));

-- =========================================================================
-- smart_locks  (eid via property)
-- =========================================================================
alter table public.smart_locks enable row level security;

drop policy if exists smart_locks_select_own on public.smart_locks;
create policy smart_locks_select_own on public.smart_locks
  for select to authenticated using (public.owns_property(property_id));

drop policy if exists smart_locks_insert_own on public.smart_locks;
create policy smart_locks_insert_own on public.smart_locks
  for insert to authenticated with check (public.owns_property(property_id));

drop policy if exists smart_locks_update_own on public.smart_locks;
create policy smart_locks_update_own on public.smart_locks
  for update to authenticated using (public.owns_property(property_id)) with check (public.owns_property(property_id));

drop policy if exists smart_locks_delete_own on public.smart_locks;
create policy smart_locks_delete_own on public.smart_locks
  for delete to authenticated using (public.owns_property(property_id));

-- =========================================================================
-- commissions  (eid av bruker; opprettes/oppdateres av admin i cron)
-- =========================================================================
alter table public.commissions enable row level security;

drop policy if exists commissions_select_own on public.commissions;
create policy commissions_select_own on public.commissions
  for select to authenticated using (user_id = auth.uid());

-- =========================================================================
-- tax_reports  (eid av bruker; bruker genererer egen rapport)
-- =========================================================================
alter table public.tax_reports enable row level security;

drop policy if exists tax_reports_select_own on public.tax_reports;
create policy tax_reports_select_own on public.tax_reports
  for select to authenticated using (user_id = auth.uid());

drop policy if exists tax_reports_insert_own on public.tax_reports;
create policy tax_reports_insert_own on public.tax_reports
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists tax_reports_update_own on public.tax_reports;
create policy tax_reports_update_own on public.tax_reports
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================================
-- audit_log  (kun lesing av egne rader; skriving skjer via admin)
-- =========================================================================
alter table public.audit_log enable row level security;

drop policy if exists audit_log_select_own on public.audit_log;
create policy audit_log_select_own on public.audit_log
  for select to authenticated using (user_id = auth.uid());

-- =========================================================================
-- cookie_consents  (innloggede styrer egne; anonyme håndteres av admin)
-- =========================================================================
alter table public.cookie_consents enable row level security;

drop policy if exists cookie_consents_select_own on public.cookie_consents;
create policy cookie_consents_select_own on public.cookie_consents
  for select to authenticated using (user_id = auth.uid());

drop policy if exists cookie_consents_insert_own on public.cookie_consents;
create policy cookie_consents_insert_own on public.cookie_consents
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists cookie_consents_update_own on public.cookie_consents;
create policy cookie_consents_update_own on public.cookie_consents
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 020 — Vaske-marked (M2: forespørsler)
-- Eier sender forespørsel til en vasker; vaskeren godtar/avslår i portalen.

create table if not exists public.service_requests (
  id                uuid primary key default gen_random_uuid(),
  cleaner_id        uuid not null references public.cleaners(id) on delete cascade,
  property_id       uuid not null references public.properties(id) on delete cascade,
  requester_user_id uuid not null references public.users(id) on delete cascade,
  job_date          date,
  message           text,
  status            text not null default 'pending'
                      check (status in ('pending','accepted','declined','cancelled')),
  created_at        timestamptz not null default now(),
  responded_at      timestamptz
);

create index if not exists service_requests_cleaner_idx on public.service_requests(cleaner_id);
create index if not exists service_requests_requester_idx on public.service_requests(requester_user_id);

alter table public.service_requests enable row level security;

-- Eier (forespørrer) styrer egne forespørsler. Vaskeren svarer via portal-token
-- (admin-klient), så den trenger ingen egen policy her.
drop policy if exists service_requests_select_own on public.service_requests;
create policy service_requests_select_own on public.service_requests
  for select to authenticated using (requester_user_id = auth.uid());

drop policy if exists service_requests_insert_own on public.service_requests;
create policy service_requests_insert_own on public.service_requests
  for insert to authenticated
  with check (requester_user_id = auth.uid() and public.owns_property(property_id));

drop policy if exists service_requests_update_own on public.service_requests;
create policy service_requests_update_own on public.service_requests
  for update to authenticated using (requester_user_id = auth.uid())
  with check (requester_user_id = auth.uid());

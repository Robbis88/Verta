-- 061 — Revisjon Batch 2: RLS/integritets-herding.
--  1) service_requests.payment_status kan bli 'refunded' (refusjon markeres i DB).
--  2) Eier (authenticated) kan ikke manipulere gebyr/beløp/betalingsstatus på
--     vaskeoppdrag, og kan kun sette status='cancelled'. Service-role fri.
--  3) Eier kan ikke endre gjestens rating/kommentar — kun owner_reply.
--  4) cleaner_reviews krever et faktisk 'accepted' oppdrag.

-- 1) Tillat 'refunded'
alter table public.service_requests
  drop constraint if exists service_requests_payment_status_check;
alter table public.service_requests
  add constraint service_requests_payment_status_check
  check (payment_status in ('unpaid','paid','refunded'));

-- 2) Beskytt service_requests mot eier-manipulering (trigger, invoker-rettigheter
--    så current_user gjenspeiler faktisk rolle: 'authenticated' = innlogget eier).
create or replace function public.protect_service_request_update()
returns trigger language plpgsql as $$
begin
  if current_user <> 'authenticated' then
    return new; -- service_role (webhook/vasker/admin) og migrasjoner: fri
  end if;
  if new.verta_fee is distinct from old.verta_fee
     or new.amount is distinct from old.amount
     or new.payment_status is distinct from old.payment_status then
    raise exception 'Endring av gebyr/beløp/betalingsstatus er ikke tillatt';
  end if;
  if new.status is distinct from old.status and new.status <> 'cancelled' then
    raise exception 'Kun kansellering er tillatt';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_service_request on public.service_requests;
create trigger trg_protect_service_request
  before update on public.service_requests
  for each row execute function public.protect_service_request_update();

-- 3) Beskytt property_reviews: eier kan kun endre owner_reply.
create or replace function public.protect_property_review_update()
returns trigger language plpgsql as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;
  if new.rating is distinct from old.rating
     or new.comment is distinct from old.comment
     or new.guest_name is distinct from old.guest_name then
    raise exception 'Kun svaret (owner_reply) kan endres';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_property_review on public.property_reviews;
create trigger trg_protect_property_review
  before update on public.property_reviews
  for each row execute function public.protect_property_review_update();

-- 4) cleaner_reviews krever et faktisk godtatt oppdrag.
drop policy if exists cleaner_reviews_own on public.cleaner_reviews;
create policy cleaner_reviews_own on public.cleaner_reviews
  for all to authenticated
  using (reviewer_user_id = auth.uid())
  with check (
    reviewer_user_id = auth.uid()
    and exists (
      select 1 from public.service_requests sr
      where sr.cleaner_id = cleaner_reviews.cleaner_id
        and sr.requester_user_id = auth.uid()
        and sr.status = 'accepted'
    )
  );

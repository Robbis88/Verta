-- 022 — Vaske-marked (M4: pris + Verta-gebyr + betalingsstatus)
-- Avtalt pris på et oppdrag, Verta sitt formidlingsgebyr, og betalingsstatus.

alter table public.service_requests
  add column if not exists amount numeric(10,2);
alter table public.service_requests
  add column if not exists verta_fee numeric(10,2);
alter table public.service_requests
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid'));

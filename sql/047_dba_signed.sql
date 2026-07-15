-- 047 — Databehandleravtale (DBA) godtatt ved onboarding
-- I direktebooking-modellen er utleieren behandlingsansvarlig for gjestedata og
-- Verta databehandler. Tidsstempel for at eieren godtok vilkår + DBA. Idempotent.
alter table public.users
  add column if not exists dba_signed_at timestamptz;

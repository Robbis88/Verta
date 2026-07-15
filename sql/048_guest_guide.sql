-- 048 — Delbar gjesteguide (funker uansett bookingkanal, også Airbnb)
-- guide_token: ugjennomsiktig lenke utleieren deler med gjestene sine.
-- appliances_info: eierens «slik funker det»-notater (varmepumpe, TV osv.) som
-- AI-conciergen svarer fra. Idempotent.
alter table public.properties
  add column if not exists guide_token uuid not null default gen_random_uuid();
alter table public.properties
  add column if not exists appliances_info text;

create unique index if not exists properties_guide_token_uniq
  on public.properties (guide_token);

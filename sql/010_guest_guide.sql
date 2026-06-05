-- 010 — Digital gjesteguide
-- Gjesteinfo per eiendom + unik token per booking til den offentlige
-- gjestesiden (/gjest/[token]).

alter table public.properties
  add column if not exists wifi_name text;
alter table public.properties
  add column if not exists wifi_password text;
alter table public.properties
  add column if not exists house_rules text;
alter table public.properties
  add column if not exists checkout_info text;

alter table public.bookings
  add column if not exists guest_token uuid not null default gen_random_uuid();

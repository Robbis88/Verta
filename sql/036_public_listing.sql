-- 036 — Offentlig boligvisning (/bo/[slug])
-- AI-generert annonsetekst + områdebeskrivelse. Genereres én gang og caches,
-- så den offentlige siden slipper å kalle AI ved hvert besøk. Idempotent.
alter table public.properties
  add column if not exists public_listing text;

alter table public.properties
  add column if not exists area_description text;

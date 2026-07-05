-- 031 — Eiendomsbilder: offentlig Storage-bucket
-- Bildene vises på den offentlige booking-siden, så bucketen er public (lesing).
-- Opplasting/sletting skjer via service-role i server actions, så det trengs
-- ingen egne RLS-policyer. Kjør i Supabase SQL Editor. Idempotent.

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update set public = true;

-- 043 — Offentlig synlighet i markedsplassen (søk på verta.no)
-- listed = false som standard: en eiendom vises IKKE på /hytter eller forsiden
-- før eieren aktivt slår den på. Direkte /bo-lenker fungerer uansett.
-- Skjuler dermed test-eiendommer umiddelbart. Idempotent.
alter table public.properties
  add column if not exists listed boolean not null default false;

-- 006 — toveis kalendersynk (iCal-import)
-- Kjør i Supabase SQL Editor. Idempotent.

-- Eksterne iCal-feeder å importere fra, som [{ "url": "...", "source": "airbnb" }]
alter table public.properties
  add column if not exists ical_urls jsonb not null default '[]'::jsonb;

-- UID fra eksternt VEVENT, for å unngå duplikater ved gjentatt import.
alter table public.bookings
  add column if not exists ical_uid text;

-- Én booking per (eiendom, ekstern UID).
create unique index if not exists bookings_property_ical_uid_uniq
  on public.bookings(property_id, ical_uid)
  where ical_uid is not null;

-- 037 — Offentlig boligvisning Fase 2
-- video_url:      valgfri hero-video (mp4/webm) på /bo/[slug]
-- nearby_pois:    cachede nærliggende steder (Overpass/OSM), se lib/pois.ts
-- travel_guide:   cachet AI-reiseguide vist på gjestesiden etter booking
-- Idempotent.
alter table public.properties
  add column if not exists video_url text;

alter table public.properties
  add column if not exists nearby_pois jsonb;

alter table public.properties
  add column if not exists travel_guide text;

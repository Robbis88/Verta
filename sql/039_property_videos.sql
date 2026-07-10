-- 039 — Offentlig Storage-bucket for eiendomsvideoer (hero-video på /bo).
-- Videoen lastes opp direkte fra nettleseren via en signert URL (server-actions),
-- så vi slipper Vercels request-størrelsesgrense. Bucket er public (lesing).
-- Idempotent.
insert into storage.buckets (id, name, public)
values ('property-videos', 'property-videos', true)
on conflict (id) do update set public = true;

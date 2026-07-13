-- 045 — Gjør skadebilder private
-- Bildene skal ikke være åpne på URL. Vi lagrer nå Storage-STIER (ikke
-- offentlige URL-er) i incident_claims.photos, og genererer kortlevde signerte
-- URL-er ved visning via service-role. Idempotent.
update storage.buckets set public = false where id = 'incident-photos';

-- 008 — Velkomst-e-post
-- Sporer at velkomst-e-posten sendes nøyaktig én gang per bruker.

alter table public.users
  add column if not exists welcomed_at timestamptz;

-- 007 — Seam smartlås (Nuki/Igloohome/Salto via aggregator)
-- Utvider smart_locks så den støtter Seam-tilkoblingsflyten.

-- Tillat flere leverandører enn nuki/yale/august (Seam dekker mange merker).
alter table public.smart_locks drop constraint if exists smart_locks_provider_check;

-- Seam holder selv låse-tokenet — vi trenger ikke lagre det.
alter table public.smart_locks alter column access_token_encrypted drop not null;

-- Nye felter for Seam-flyten.
alter table public.smart_locks add column if not exists connected_account_id text;
alter table public.smart_locks add column if not exists connect_webview_id text;

-- Tillat 'pending' mens eieren fullfører tilkoblingen i Connect Webview.
alter table public.smart_locks drop constraint if exists smart_locks_status_check;
alter table public.smart_locks add constraint smart_locks_status_check
  check (status in ('connected','error','disconnected','pending'));

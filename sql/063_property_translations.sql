-- 063 — Cache for AI-oversettelser av eierens fritekst på gjestesiden.
-- Eieren skriver på norsk; gjesten leser på sitt språk. Vi oversetter med AI én
-- gang per (bolig, felt, språk) og lagrer her. source_hash gjør at vi bare
-- oversetter på nytt når kilde-teksten faktisk endres.

create table if not exists public.property_translations (
  property_id uuid not null references public.properties(id) on delete cascade,
  field       text not null,   -- 'access_info' | 'house_rules' | 'checkout_info' | 'travel_guide'
  lang        text not null,   -- 'en' | 'de'
  source_hash text not null,   -- hash av kilde-teksten (norsk)
  translated  text not null,
  updated_at  timestamptz not null default now(),
  primary key (property_id, field, lang)
);

-- Kun service-role (gjestesiden bruker admin-klient) rører denne. RLS på, ingen
-- policyer → ingen innloggede/anon-brukere får tilgang.
alter table public.property_translations enable row level security;

# VERTA — Complete Project Specification

**Verta** is a premium SaaS platform for Norwegian short-term rental property owners (Airbnb, Booking.com, vacation homes). It simplifies property management, tax reporting, multi-channel marketing, and booking optimization through a three-tier pricing model with AI-powered marketing and smart integrations.

> **Implementation note (added by Claude Code):** This spec was written against "Next.js 15 + NextAuth". The repo runs **Next.js 16** (where `middleware.ts` is now `proxy.ts`) and there are unresolved architectural decisions — see `IMPLEMENTATION_NOTES.md` for the deviations agreed with the owner. Where this spec and `IMPLEMENTATION_NOTES.md` disagree, the notes win.

---

## 1. Project Overview

### Vision
Enable property owners across Norway to manage their rental business independently — handling bookings, occupancy optimization, tax compliance, and marketing — without relying on expensive management companies or complex tools built for large enterprises.

### Market
- **Primary:** Norwegian vacation home owners (hytte, leilighet, hus) who rent on Airbnb, Booking.com, Finn
- **Secondary:** Small investors with 1-5 rental properties
- **Size:** ~400,000 vacation homes in Norway; ~20-30% rent out; focus on active renters (50+ days/year)

### Revenue Model (3-tier + add-ons)
| Tier | Price | Properties | Features |
|---|---|---|---|
| **Basis** | 149 kr/mnd | 1 | Kalender (Airbnb sync) + direkte booking-side + skatt-rapport + AI-annonse |
| **Pluss** | 249 kr/mnd | 1 | Basis + multi-kanal (Finn) + boost-annonsering + SMS-notifikasjoner + analytics |
| **Premium** | 349 kr/mnd | 1 | Pluss + smartlås (Nuki) + priority support + advanced tax reporting + API access |
| **+Property (Premium only)** | +99 kr/mnd | Each extra | Full feature parity (boosts, analytics, smartlås) |

**Additional Revenue Streams:**
- Boost payments (customer pays 300–1000 kr per campaign via Vipps)
- Provisjon: 10% of bookings that come from Verta's Instagram/Facebook channels
- Smartlås integration (optional upsell, included in Premium)

---

## 2. Tech Stack (Non-negotiable)

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | 16 | All interactive features in `app/` |
| Runtime | React | 19 | Server Components default, Client when needed |
| Language | TypeScript | 5+ | `strict: true` — no `any` without reason |
| Styling | Tailwind CSS | v4 | `@theme` for custom colors (no JS config) |
| Database | Supabase PostgreSQL | Latest | RLS from day one, no exceptions |
| Auth | Supabase Auth + Vipps OIDC | - | Vipps OpenID Connect for login (see IMPLEMENTATION_NOTES) |
| Payments | Stripe + Vipps | - | Stripe for subscriptions, Vipps for one-offs |
| AI | Anthropic Claude | claude-opus-4-6 / claude-sonnet-4-6 | Via @anthropic-ai/sdk for boost copy + tax insights |
| Email | Resend | Latest | Transactional emails only (no marketing yet) |
| Hosting | Vercel | - | Auto-deploy on push to main |
| Monitoring | Sentry (optional) | - | For production error tracking |

**Forbidden:**
- ❌ Mongoose, MongoDB, Firebase
- ❌ Express backend (Next.js Route Handlers sufficient)
- ❌ Redux, Zustand, Context-only for UI state
- ❌ `useEffect` for data fetching in Server Components
- ❌ Passwords (Vipps login only)

---

## 3. Architecture & Core Principles

### 3.1 Single-Tenant, User-Based (NOT Org-Based)
- Each property owner = one user account
- No `organization` concept (no multi-user teams yet)
- RLS is user-to-data (not org-to-data)

Core tables, RLS policies, server-action patterns, the auth flow, the 4-layer
feature gating, payment flows, the full schema (8 tables), API endpoints,
roadmap, KPIs, compliance and the target file structure are all captured in the
original specification provided by the owner. The complete original text is
preserved here as the source of truth for product intent; technical deviations
required to actually build it on this stack live in `IMPLEMENTATION_NOTES.md`.

### Core Tables (DDL — product intent)

```sql
create table users (
  id uuid primary key,                 -- see IMPLEMENTATION_NOTES re: auth.users link
  ssn text,                            -- see IMPLEMENTATION_NOTES re: fødselsnummer handling
  name text not null,
  email text unique not null,
  phone text not null,
  address text,
  plan text default 'gratis',          -- 'gratis' | 'basis' | 'pluss' | 'premium'
  stripe_customer_id text,
  extra_properties_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  address text,
  description text,
  bedrooms int,
  bathrooms int,
  max_guests int,
  images jsonb,
  airbnb_calendar_id text,
  booking_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  guest_name text not null,
  guest_email text,
  guest_phone text,
  check_in date not null,
  check_out date not null,
  total_price decimal(10,2),
  nights int,
  source text not null,                -- 'airbnb'|'booking'|'verta_direct'|'verta_instagram'|'verta_facebook'
  utm_campaign_id text,
  status text default 'confirmed',     -- 'confirmed'|'cancelled'|'completed'
  notes text,
  created_at timestamptz default now(),
  constraint valid_dates check (check_out > check_in)
);

create table boosts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  status text default 'pending',       -- 'pending'|'approved'|'active'|'completed'|'failed'
  budget_nok decimal(10,2) not null,
  platform text not null,              -- 'instagram'|'facebook'|'both'
  start_date date not null,
  end_date date not null,
  ai_generated_text text,
  user_approved_text text,
  image_url text,
  utm_campaign_id text unique,
  bookings_count int default 0,
  revenue_from_boost decimal(10,2) default 0,
  commission_amount decimal(10,2),
  created_at timestamptz default now(),
  approved_at timestamptz,
  completed_at timestamptz,
  constraint valid_boost_dates check (end_date > start_date)
);

create table commissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  period text not null,                -- 'january_2026', ...
  booking_ids uuid[] not null,
  total_revenue decimal(10,2),
  commission_amount decimal(10,2),
  status text default 'pending',       -- 'pending'|'processed'|'paid'
  paid_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, period)
);

create table smart_locks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  provider text not null,              -- 'nuki'|'yale'|'august'
  device_id text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  status text default 'connected',     -- 'connected'|'error'|'disconnected'
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tax_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  year int not null,
  total_income decimal(10,2),
  income_from_airbnb decimal(10,2),
  income_from_booking decimal(10,2),
  income_from_verta_direct decimal(10,2),
  income_from_verta_boosts decimal(10,2),
  verta_commission_paid decimal(10,2),
  taxable_income decimal(10,2),
  status text default 'draft',         -- 'draft'|'ready_for_skatteetaten'|'submitted'
  generated_at timestamptz default now(),
  unique(user_id, year)
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  resource_type text,
  resource_id uuid,
  changes jsonb,
  severity text default 'info',        -- 'info'|'warning'|'security'
  ip_address inet,
  created_at timestamptz default now()
);

create table cookie_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  session_id text,
  analytics boolean default false,
  marketing boolean default false,
  created_at timestamptz default now()
);
```

### 3.2 Row-Level Security
Every user-owned table has RLS enabled with `user_id = auth.uid()` policies for
select/insert/update. Full policy set lives in `sql/005_rls_policies.sql`.

### 3.3 Server Actions
All writes are `'use server'` actions in `app/<feature>/actions.ts`, returning a
typed `FormState`, calling `revalidatePath`, and writing to `audit_log`.

### 3.4 Auth
Vipps OpenID Connect for login. **See IMPLEMENTATION_NOTES.md** for how Vipps
plugs into Supabase Auth (the spec's RLS/`auth.uid()` data layer requires it).

### 3.5 Subscription & Feature Gating (4 layers)
1. **Database** — RLS `with check` enforcing the per-plan property limit
2. **Server action** — re-checks count vs limit before insert
3. **Frontend** — shows count/limit and upgrade CTAs
4. **Billing** — Stripe subscription + `extra_properties_count` from webhook

---

## 4. Payment Flow
- **Subscriptions (Stripe):** tier → Stripe Checkout → `customer.subscription.*` webhook updates `users.plan`.
- **Boosts (Vipps):** boost record (pending) → Vipps payment → `/api/vipps/callback` webhook → boost `approved`.

---

## 5. Database Migrations (run in order)
1. `001_users_properties_bookings.sql`
2. `002_boosts_commissions.sql`
3. `003_smart_locks_tax.sql`
4. `004_audit_cookies.sql`
5. `005_rls_policies.sql`

---

## 6. API Endpoints

**Public:** `GET /api/properties/:slug`, `POST /api/bookings`, `POST /api/vipps/callback`, `POST /api/stripe/webhook`

**Authenticated:** properties CRUD, bookings CRUD, boosts (+ start-payment, approve), tax (report/generate), commissions (period/summary), smartlock (status/connect/callback). Full list in original spec.

---

## 7. Authentication Flow
Registration: land → "Registrer med Vipps" → Vipps OIDC → callback creates user (plan=`gratis`) + Stripe customer → `/onboarding` → property + tier → Stripe checkout → webhook sets plan → `/dashboard`.
Login: "Logg inn" → Vipps OIDC → session with plan + `stripe_customer_id` → `/dashboard`.

---

## 8. Boost & Commission System
- **Phase 1 (MVP):** AI copy + image → owner approves → Vipps payment → admin posts manually with UTM → bookings tracked via UTM → monthly commission calc + payout.
- **Phase 2:** Meta Marketing API auto-deploy + pixel ROI.

---

## 9. Tax Reporting (Norwegian)
Annual report: income per source, boost income, commission paid, deductions,
taxable income (15 000 kr fribeløp on primary residence), export PDF + JSON for
Skatteetaten DPI.

---

## 10. Smart Lock (Premium, Nuki first)
Connect via Nuki OAuth → encrypted tokens in Supabase → on booking: generate
6-digit code valid check-in→check-out, SMS to guest, auto-deactivate, notify owner.
Yale/August = Phase 2+.

---

## 11. Landing Page & Onboarding
Hero, pain points (Airbnb 15% gebyr, skatterot, flere kalendre, lav synlighet),
pricing table, "how it works", testimonials (future), FAQ. Onboarding: property
form → calendar sync → plan + Stripe → dashboard → optional smartlock/Finn.

---

## 12. Compliance & Security
GDPR docs in `/compliance/` (privacy, terms, DPA, incident response). Cookie
consent banner, GDPR export/delete endpoints, audit log, encryption at rest/in
transit. Skatteetaten DPI registration. Stripe PCI; Vipps partner; signed webhooks.

---

## 13. Analytics & Dashboards
**User:** occupancy, monthly revenue, commissions, booking-source breakdown,
boost ROI, commission tracker, property calendar + direct booking link.
**Admin:** total properties, users by tier, MRR, commission payouts, usage/churn.

---

## 14. Phase Roadmap
- **Phase 0 (wk 1–2):** scaffold, Supabase, Vipps login, onboarding, dashboard skeleton, property CRUD.
- **Phase 1 (wk 3–6):** direct booking page, boosts, commissions, smartlås (Nuki), tax report, feature gating.
- **Phase 2 (wk 7–12):** multi-kanal (Finn/Booking), Meta API, analytics, Yale/August, email campaigns.
- **Phase 3 (wk 13+):** mobile (Expo), AI tax advisor, marketplace, Norden expansion.

---

## 15. KPIs (6 months)
Active users 50–100 · MRR 8–12k kr · boost usage 10–15% · commission 500–1000 kr/mnd · churn < 5%/mnd · NPS > 50.

---

## 16. Tech Debt / Known Issues
Smartlås Nuki-only (P1); Airbnb-sync only (P1); manual boost posting (P1);
basic UTM analytics (P1); Norwegian-only i18n (P1).

---

## 17. Environment Variables
See `.env.example` for the full list (Supabase, Vipps, Stripe, Anthropic, Resend, site, cron).

---

## 18. Deployment Checklist
Pre-launch: Supabase (EU), Vipps creds, Stripe products, Vercel link, env vars,
migrations, Resend templates, GDPR pages, Nuki test acct, Sentry, analytics.
Go-live: `tsc --noEmit`, push main, test Vipps/Stripe/Vipps-boost flows, verify
RLS isolation + audit logging, monitor 24h, announce to beta.

---

## 19. Phased Build Order (Stein)
- **Stein 0:** repo setup (tsconfig, `.env.example`, `vercel.ts`)
- **Stein 1:** Supabase migrations (001–005)
- **Stein 2:** Vipps login (auth config + login page)
- **Stein 3:** onboarding (property form → tier → Stripe)
- **Stein 4:** dashboard (overview, property list)
- **Stein 5:** direct booking page (`/properties/[slug]`)
- **Stein 6:** boost system (AI copy, approval, Vipps payment)
- **Stein 7:** commission tracking + monthly payouts
- **Stein 8:** tax report generation
- **Stein 9:** smartlås (Nuki)

---

## 20. Target File Structure
App Router under `app/` (this repo does **not** use `src/`). `lib/` for auth,
supabase (client/server/admin), stripe, vipps, audit, utils, constants.
`components/` (ui + feature folders). `sql/` migrations. `compliance/` docs.

---

## 21. Critical Success Factors
Vipps from day one · RLS enforced · audit logging · tax reporting (the moat) ·
automated commission tracking · hard feature gating · clean schema from the start.

---

## 22. References
Supabase Auth, Vipps Login (github.com/vippsas/vipps-login), Stripe API,
Anthropic API, Vercel docs, Skatteetaten.

---

**Document Version:** 1.0 · **Owner:** Robert / Verta Team

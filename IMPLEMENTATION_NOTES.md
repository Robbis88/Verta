# Implementation Notes — avvik fra VERTA_PROSJEKT.md

Dette dokumentet sporer hvor den faktiske implementasjonen bevisst avviker fra
`VERTA_PROSJEKT.md`. Der spec og disse notatene er uenige, **vinner notatene**.
Avvikene er avtalt med eieren (2026-06-03).

## 1. Auth: Supabase Auth + Vipps OIDC (ikke NextAuth)

Spec-en oppgir "NextAuth.js + Vipps", men hele datalaget bruker
`supabase.auth.getUser()` og RLS-policyer med `auth.uid()`. Det krever **Supabase
Auth** — med NextAuth ville `auth.uid()` vært null og alle RLS-spørringer feilet.

**Løsning:** Supabase Auth som identitets-/session-lag. Vipps kobles inn som
**custom OIDC-provider** i Supabase (auto-discovery).
- Vipps discovery (prod): `https://api.vipps.no/access-management-1.0/access/.well-known/openid-configuration`
- Vipps issuer (test): `https://apitest.vipps.no/access-management-1.0/access/`
- Provider-id i Supabase: `custom:vipps` → `signInWithOAuth({ provider: 'custom:vipps' })`

Inntil Vipps merchant er klart bruker vi **dev-fallback med e-post magic-link**
(`signInWithOtp`). Datalaget er identisk uansett provider, så påkoblingen blir
en konfig-endring i Supabase Dashboard + bytte av innloggingsknapp.

## 2. Fødselsnummer lagres ikke

Spec-en lagrer SSN i klartekst som unik kolonne og primærnøkkel. Det er
sensitive personopplysninger (GDPR) og teknisk ugyldig (uuid vs text).

**Løsning:** Supabase-uuid (`auth.users.id`) som PK. Vi ber **ikke** om
`nin`-scopet fra Vipps. Vipps `sub` (ugjennomsiktig bruker-id per merchant,
ikke SSN) lagres som `users.vipps_sub` for gjenkjenning ved innlogging.

## 3. Next.js 16-konvensjoner

- `proxy.ts` (rot) i stedet for `middleware.ts` (middleware ble omdøpt i Next 16).
- `cookies()` er asynkron.
- Tailwind v4: `@theme` i CSS, ingen `tailwind.config.{ts,js}`.
- `app/` i prosjektroten — **ikke** `src/` (spec-ens filtre viser `src/`).
- Modell: gjeldende Claude (`claude-sonnet-4-6` / `claude-opus-4-6`), ikke
  `claude-opus-4-7` som spec-en nevner.

## 4. Vipps-betaling: ePayment, ikke ecomm v2

Spec §4.2 bruker `ecomm/v2`-API-et som er utdatert. Boost-betaling (Stein 6)
bygges mot **Vipps ePayment API**.

## 5. vercel-config utsatt

`vercel.ts` (med cron for månedlig provisjon) lages ved Stein 7 / før deploy,
ikke i Stein 0 — det er ingen ruter å konfigurere ennå, og en tom config med
import fra `@vercel/config` ville bare være støy.

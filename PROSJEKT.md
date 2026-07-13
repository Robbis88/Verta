# Verta — komplett prosjektdokumentasjon (blåkopi)

> Levende referanse over hva Verta faktisk **er bygget som** (ikke den opprinnelige spec-en — den ligger i `VERTA_PROSJEKT.md`). Skrevet så den kan gjenbrukes som mal for et lignende SaaS + markedsplass-prosjekt.
> Sist oppdatert: 2026-07-13.

---

## 1. Hva Verta er

SaaS + markedsplass for norske korttidsutleiere (hytter, leiligheter, feriehus). Tre ting i ett:

1. **Administrasjonssystem** (eierportal) — kalender, bookinger, kostnader, inntekter, lån, vedlikehold, vask, skatt, AI, historikk.
2. **Bookingplattform** — hver eiendom får en offentlig, Airbnb-aktig side (`/bo/[slug]`) med direkte booking og betaling.
3. **Markedsplass** — søkbar oversikt (`/hytter`) over eiendommer som eieren har valgt å publisere, + et vaske-marked som kobler utleiere med vaskere.

Forskjellen fra Airbnb: bygget med **eieren i sentrum**, og med skatt/økonomi på autopilot.

---

## 2. Tech-stack (faktisk)

| Lag | Valg | Versjon |
|-----|------|---------|
| Rammeverk | Next.js (App Router, Turbopack) | 16.2.7 |
| Runtime | React (Server Components default) | 19.2 |
| Språk | TypeScript (`strict`) | 5 |
| Styling | Tailwind CSS v4 (`@theme`, ingen JS-config) | 4 |
| UI | shadcn + radix-ui + lucide-react | — |
| DB | Supabase PostgreSQL (RLS overalt) | — |
| Auth | Supabase Auth (e-post/passord + magic-link; Vipps OIDC forberedt) | — |
| Betaling | Stripe (abonnement + Connect marketplace) | stripe ^22 |
| AI | Anthropic Claude (`claude-sonnet-4-6`) | @anthropic-ai/sdk |
| E-post | Resend | resend ^6 |
| Smartlås | Seam (Nuki/Igloohome/Salto via ett API) | seam ^1.2 |
| Kart | Leaflet + OpenStreetMap (ingen nøkkel) | leaflet ^1.9 |
| Geokoding | Kartverket / Geonorge (gratis, ingen nøkkel) | — |
| Validering | Zod | ^4 |
| Hosting | Vercel (auto-deploy på push til `main`) | — |

**MERK:** `middleware.ts` heter `proxy.ts` i Next 16. Les `node_modules/next/dist/docs/` før Next-spesifikk kode (APIene avviker fra eldre versjoner).

---

## 3. Arkitektur & kjernemønstre (det gjenbrukbare)

### 3.1 Supabase-klienter — tre varianter
- `lib/supabase/server.ts` → `createClient()` (server, respekterer **RLS** for innlogget bruker). Standard i dashboard/actions.
- `lib/supabase/admin.ts` → `createAdminClient()` (**service-role**, omgår RLS). Kun for: webhooks, token-baserte offentlige sider (gjest/vasker/krav/godkjenn), systemjobber.
- `lib/supabase/client.ts` → `createClient()` (browser/anon). For direkte Storage-opplasting fra klient.

**Regel:** RLS er tilgangskontrollen. Bruk admin-klient kun når tokenet/webhook-signaturen er kontrollen i stedet.

### 3.2 Row-Level Security
Alle bruker-eide tabeller har RLS på fra dag én. Mønster: `user_id = auth.uid()`, eller via hjelpefunksjon `owns_property(property_id)`. Delte ressurser (anmeldelser, krav) bruker `exists (select 1 from properties p where p.id = property_id and p.user_id = auth.uid())`.

### 3.3 Server Actions
Alle skrivinger er `'use server'`-funksjoner i `app/<feature>/actions.ts`. Returnerer typet `FormState`, kaller `revalidatePath`, og logger til `audit_log` via `logAudit`. Feil i penge-actions **fanges** (try/catch) og redirecter med melding — aldri la en Stripe-feil velte hele siden.

### 3.4 Token-portaler (offentlig tilgang uten innlogging)
Gjennomgående mønster: en ugjennomsiktig UUID-token gir tilgang til en side, uten innlogging. Brukt for:
- `/gjest/[guest_token]` — gjestens opphold (betal depositum/rest, avbestill, anmeld, reiseguide).
- `/vasker/[access_token]` — vaskerens portal (oppgaver, profil, utbetaling).
- `/handverker/[token]` — håndverkerens portal.
- `/godkjenn/[owner_token]` — eier godkjenner/avslår booking fra e-post.
- `/krav/[claim_token]` — gjest betaler skadekrav.

Sikkerhet: tokenet er nøkkelen; sidene bruker admin-klient. **POST-knapper** (ikke ett-klikks GET) for handlinger, siden e-postklienter forhåndslaster lenker.

### 3.5 Stripe Connect (marketplace-modell)
Verta er **plattform/marketplace**: samler inn fra kunder, betaler ut til selgere via **destination charges**.
- Utleiere og vaskere kobler egen **Express-konto** (`stripe_connect_id`, `payouts_enabled`).
- Betaling: `checkout.sessions.create({ payment_intent_data: { application_fee_amount, transfer_data: { destination } } })` → plattformens gebyr beholdes, resten overføres til mottakerens konto.
- `account.updated`-webhook speiler `payouts_enabled` til både `users` og `cleaners`.
- **Idempotens:** stabile `idempotencyKey` per betaling (`deposit-<id>`, `remaining-<id>`, `claim-<id>`, `service-<id>`) mot dobbeltbelastning.

### 3.6 Migrasjons-disiplin
Nummererte SQL-filer i `sql/NNN_*.sql`, kjøres i rekkefølge i Supabase SQL Editor. Idempotente (`if not exists`, `on conflict`, `drop policy if exists`). `sql/all_migrations.sql` er autogenerert samlefil (kun trygg på tom DB). **45 migrasjoner** per i dag.

### 3.7 Feature-gating (4 lag)
1. **RLS** `with check` for plan-grense.
2. **Server action** re-sjekker antall vs. grense.
3. **Frontend** viser antall/grense + oppgrader-CTA.
4. **Billing** — Stripe-abonnement + `extra_properties_count` fra webhook. Betalingsmur i `app/dashboard/layout.tsx` (plan `gratis` → `/onboarding/plan`, admin unntas).

### 3.8 Offentlig innhold caches
AI-tekst, POI-er og reiseguide genereres **én gang** og lagres på eiendommen (`public_listing`, `area_description`, `nearby_pois`, `travel_guide`) — så offentlige sider ikke kaller AI/Overpass ved hvert besøk.

---

## 4. Datamodell (nøkkeltabeller)

Kjerne (`sql/001`): `users`, `properties`, `bookings`. Deretter utvidet gjennom 45 migrasjoner. Viktige felter og kolonner:

- **users:** `plan`, `extra_properties_count`, `stripe_customer_id`, `stripe_connect_id`, `payouts_enabled`, `vipps_sub`.
- **properties:** navn/adresse/specs, `images` (jsonb), `amenities` (text[]), `lat/lng` (geokodet), priser (`base_nightly_rate`, `cleaning_fee`), `booking_mode` ('instant'|'request'), eiendomsfinans (`market_value`, `loan_amount`, `interest_rate`, `monthly_principal`), offentlig innhold (`public_listing`, `area_description`, `video_url`, `nearby_pois`, `travel_guide`), `listed` (offentlig synlig – default **false**).
- **bookings:** gjestinfo, datoer, `nights`, `total_price` (= **utleierens inntekt**), `service_fee`, `amount_total` (= **det gjesten betaler**), `source`, `status`, `guest_token`, `owner_token`, depositum/rest-felter, Stripe-referanser.
- **cleaners:** profil + marked (`available_for_hire`, `hourly_rate`, `bio`, `lat/lng`), `access_token`, `stripe_connect_id`, `payouts_enabled`.
- **service_requests:** vaskeoppdrag (pris, `verta_fee` (10%), `payment_status`).
- **incident_claims:** skadekrav (`claim_token`, `amount`, `description`, `photos` (private stier), `status`).
- **property_reviews:** gjeste-anmeldelser (rating, kommentar, `owner_reply`).
- Ellers: `boosts`, `commissions` (deaktivert), `smart_locks`, `tax_reports`, `expenses`, `maintenance`, `supplies`, `cleaning_tasks`/`cleaning_photos`, `seasonal_rates`, `property_owners`/`owner_contributions`, `property_events`, `audit_log`, `cookie_consents`.

Storage-buckets: `property-images` (public), `property-videos` (public), `cleaning-photos` (privat), `incident-photos` (privat).

---

## 5. Betaling & pengeflyter

### 5.1 Abonnement (Stripe)
`choosePlan` → Stripe Checkout (`mode: subscription`, 14 dagers prøve) → `customer.subscription.*`-webhook oppdaterer `users.plan`. Dev-fallback setter plan direkte hvis Stripe ikke er konfigurert. Planer: Basis 149 / Pluss 249 / Premium 399 kr/mnd + ekstra eiendom 99 kr/mnd.

### 5.2 Gjestebetaling for opphold (Stripe Connect)
- **Inntektsmodell:** Verta tar **IKKE** provisjon fra eier. Gjesten betaler **7,5 % tjenestegebyr** (av netter + rengjøring) på toppen. Utleieren får hele sitt beløp.
- `total_price` = utleierens inntekt (uendret for analyse/skatt). `service_fee` = gebyret. `amount_total` = det gjesten betaler.
- Stripe: gjesten belastes `amount_total`, `application_fee_amount = service_fee`, resten `transfer` til utleier.
- **Instant-modus:** betal alt med en gang. **Request-modus:** eier godkjenner → 50 % depositum → 50 % rest (forfaller 7 dager før innsjekk).
- **Kortvarsel-regel:** er innsjekk < 7 dager unna (restfristen alt passert), kreves **full betaling med en gang**.

### 5.3 Refusjon / avbestilling
Policy vist til gjest: 14+ dager = full, 2–14 dager = 50 %, < 48t = ingen. `cancelAndRefund` refunderer **hver** betaling (depositum + rest) proporsjonalt etter samme andel, med `refund_application_fee` + `reverse_transfer`.

### 5.4 Skadekrav i etterkant (uten depositum)
Eier melder skade (beløp + beskrivelse + bilder) → gjest får krav på e-post → betaler via `/krav/[token]` → hele beløpet til utleier (ingen provisjon). Kun Verta-bookinger. Bilder private (signerte URL-er).

### 5.5 Vaske-marked (Stripe Connect)
Eier bestiller vaskeoppdrag → vasker godtar → eier betaler → **Verta beholder 10 %** (`MARKET_FEE_RATE`), resten til vaskerens konto. Vaskeren kobler utbetaling i portalen sin, med forklaring om skatt/ENK.

### 5.6 Boost (Vipps ePayment)
Boost opprettes → betales via Vipps ePayment → `/api/vipps/return` aktiverer. Dev-fallback uten nøkler.

### 5.7 Vipps
`lib/vipps.ts` har ePayment (boost) + er forberedt for Recurring (abonnement). Aktiveres når merchant-nøkler finnes. Recurring-abonnement er **planlagt, ikke bygget** (venter på Vipps-godkjenning).

---

## 6. Offentlig boligvisning & markedsplass

- **`/bo/[slug]`** — premium, mobil-først: hero (bilde/video), galleri m/ lightbox, AI-annonsetekst + områdebeskrivelse, fasiliteter m/ ikoner, kart (OSM) + POI-er (Overpass), husregler, anmeldelser, sticky booking + mobil booking-bar. SEO + OG (ekte foto). Gammel `/properties/[slug]` → 308-redirect hit.
- **`/hytter`** — markedsplass: søk + filtre (pris, gjester, datoer, fasiliteter) + Leaflet-kart med pris-nåler. Viser kun `listed = true`.
- **Forsiden** (`app/page.tsx`) — landingsside + «Utforsk hyttene»-teaser.
- **`listed`-bryter** (default **false**): ingenting offentlig i søk før eier velger det. Delte `/bo`-lenker fungerer uansett.
- **AI-tekst** eierstyrt: generer/regenerer i valgt tone, rediger (`public-listing-editor`).

---

## 7. Vaske-økosystem

- **Eierens side** (`/dashboard/rengjoring`): legg til vaskere, generer oppgaver fra bookinger, tildel, se stemplings-GPS + før/etter-bilder.
- **Finn vaskehjelp** (`/dashboard/finn-vaskehjelp`): match vaskere på avstand (Haversine), send oppdrag, betal (Stripe), anmeld.
- **Vaskerens portal** (`/vasker/[token]`): oppgaver, klokke inn/ut m/ posisjon, før/etter-bilder, markedsprofil, **utbetaling (Stripe Connect) + forklaring** om 10 % gebyr, eget skatteansvar/ENK, og at Verta rapporterer til Skatteetaten (DAC7).

---

## 8. Øvrige moduler

- **Smartlås (Seam):** koble Nuki/Igloohome/Salto → auto-generert adgangskode ved booking (gyldig innsjekk→utsjekk), sendes til gjest. Premium.
- **Skatt (`/dashboard/tax`):** årsrapport per kilde, fradrag, skattepliktig inntekt (fribeløp egen bolig / regnskapsligning hytte), print + JSON.
- **Eiendomsøkonomi (`/dashboard/okonomi`):** verdi/lån/EK/belåningsgrad, inntekter/kostnader, delt eierskap (medeiere + innbetalinger), hendelseslogg, bankrapport.
- **AI (`lib/ai.ts`):** annonsetekst, områdebeskrivelse, reiseguide, gjestesvar, prisforslag, kampanje for tomme datoer, anmeldelsessvar. Alltid «kun fakta, ikke finn på».
- **E-post (`lib/email.ts`):** bookingbekreftelse, godkjent/avslått, depositum/rest, avbestilling, skadekrav, forespørsel-varsel — HTML via Resend.
- **Cron (vercel.json):** heartbeat, provisjon, iCal-sync, tomme datoer, rengjøringsoppgaver, opprydding, frigi holds, rest-påminnelser. Beskyttet med `CRON_SECRET`.

---

## 9. Juridisk / compliance

- **RLS** + audit-log + GDPR-eksport/sletting (`/api/gdpr/export`, sletteknapp).
- **Juridiske sider:** `/vilkar` (B2B), `/salgsvilkar` (forbruker, for Vipps-verifisering — betaling/angrerett/refusjon/klage), `/personvern`, `/databehandleravtale`. Selskapsdata i `lib/company.ts` (R-G Invest AS).
- **DAC7 / plattformrapportering:** Verta har opplysningsplikt til Skatteetaten for utbetalinger til tjenesteytere (vaskere) — forklart i vasker-portalen.
- **Ikke fødselsnummer.** Betalingsdetaljer hos Stripe/Vipps.

---

## 10. Miljøvariabler (`.env.example`)

Må: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAILS`, `CRON_SECRET`.
Betaling: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASIS/PLUSS/PREMIUM/EXTRA_PROPERTY`.
Valgfritt: `RESEND_API_KEY`/`EMAIL_FROM`, `VIPPS_*`, `SEAM_API_KEY`, `KONTROLLROM_*`.

**Test vs. live:** Stripe har adskilte nøkler/produkter/webhooks/Connect-kontoer per modus. Ved go-live må price-IDer, webhook-secret og Connect-kontoer være **live**, ellers feiler betaling.

---

## 11. Gjenbrukbare konvensjoner (ta med til nytt prosjekt)

1. **Tre Supabase-klienter** (server-RLS / admin-service-role / browser) med klare regler for hver.
2. **Token-portaler** for all offentlig tilgang uten innlogging (UUID + admin-klient + POST-knapper).
3. **Stripe Connect destination charges** for marketplace; `application_fee_amount` = plattformgebyr; `idempotencyKey` per betaling.
4. **Skill «hva selgeren tjener» fra «hva kjøperen betaler»** i datamodellen (`total_price` vs `amount_total`) — så analyse/skatt ikke roter.
5. **Cache AI/eksterne kall** på raden (generer én gang, lagre) — offentlige sider skal ikke kalle AI ved hvert besøk.
6. **Nummererte, idempotente SQL-migrasjoner** kjørt manuelt i rekkefølge.
7. **Penge-actions fanger feil** og redirecter med melding — aldri velt hele siden.
8. **Synlighet av som standard** (`listed=false`) — ingenting blir offentlig ved uhell.
9. **Verifiser før commit:** `tsc --noEmit` + `eslint` + `next build`. Push til `main` = auto-deploy.
10. **Merkefarger i Tailwind `@theme`** (navy/gull/cloud/ink/hairline) — gjenbrukes i UI-komponenter.

---

## 12. Utvikling / kommandoer

```bash
npm install
npm run dev            # Next dev (Turbopack)
node_modules/.bin/tsc --noEmit    # typecheck
node_modules/.bin/eslint <sti>    # lint
npm run build          # produksjonsbygg
```

Migrasjoner kjøres manuelt i Supabase → SQL Editor (`sql/NNN_*.sql` i rekkefølge). Deploy skjer automatisk på `git push origin main` (Vercel).

---

**Status:** ~45 migrasjoner, ~77 ruter. Kjernefunksjonalitet komplett. Gjenstår: Vipps Recurring-abonnement (venter godkjenning), evt. Meta Marketing API for boost.

# Verta — Systemdokumentasjon

Fullstendig oversikt over hvordan Verta er bygget: landingsside, dashbord,
gjesteflater, betaling, AI og datamodell. Ment som referanse for utvikling og
for å briefe nye samarbeidspartnere (eller en AI-assistent).

---

## 1. Hva Verta er

En norsk SaaS + markedsplass for korttidsutleie (hytter, leiligheter, Airbnb).
Eieren får ett verktøy for kalender, booking, betaling, gjestekommunikasjon,
smartlås, økonomi/skatt, rengjøring, vedlikehold og markedsføring.

**Forretningsmodell:** Flat pris «alt inkludert» — **399 kr/mnd** (eller 3 990
kr/år), +199 kr/mnd (1 990/år) per ekstra eiendom. **0 % plattformgebyr på
leien** — gjesten betaler eieren direkte. Verta tar **10 %** kun på markedsplass-
tjenester (vask + utstyrsutleie). 14 dagers gratis prøve.

---

## 2. Teknisk stack

- **Next.js 16.2.7** (App Router, Turbopack, React 19 Server Components)
- **TypeScript** (strict), **Tailwind v4** (`@theme`), **shadcn/radix/lucide**
- **Supabase** (Postgres + Auth + Storage), **RLS overalt**
- **Stripe** (abonnement + Stripe Connect for utbetalinger)
- **Anthropic Claude** (AI-funksjoner) · **Resend** (e-post) · **Leaflet** (kart)
- **Seam / Nuki** (smartlås) · **Vipps** (pauset)
- Hosting: **Vercel** · Domene: **verta.no**

### Tre Supabase-klienter
- `createClient()` (server) — respekterer RLS, for innlogget bruker.
- `createAdminClient()` (service-role) — omgår RLS, for webhooks + token-portaler.
- `createClient()` (browser) — klientkomponenter.

### Sikkerhetsmønstre
- **RLS** på alle tabeller; `owns_property(property_id)`-hjelpefunksjon i policyene.
- **Token-portaler**: ugjennomsiktige UUID-lenker gir tilgang uten innlogging
  (gjest, vasker, godkjenn, krav, guide, håndverker). Handlinger er POST-knapper
  (ikke ett-klikks GET) så e-post-prefetch ikke trigger dem.
- **Betalingsmur**: `plan = "gratis"` → sendes til `/onboarding/plan`. Admin unntas.
- **Admin** styres av `ADMIN_EMAILS`; admin-sider krever tofaktor (AAL2).

---

## 3. Landingssiden (`app/page.tsx`)

Offentlig markedsføringsside, bygget av seksjonskomponenter i `components/landing/`.
Rekkefølge:

1. **Navbar** — logo + ankerlenker (Funksjoner, Innsikt, Integrasjoner, Priser, FAQ) + Logg inn.
2. **Hero** — hovedbudskap + CTA til `/registrer`.
3. **FeatureGrid** — 6 kjernefunksjoner: gebyrfri booking, kalender/kanaler, AI-gjesteguide på alle språk, utleie av utstyr, eiendomsøkonomi/skatt, vask/drift/smartlås.
4. **VideoSection** (×3) — korte videoklipp med tekst («Fra kaos til kontroll», «For gjestene», «For eiere/forvaltere»).
5. **ProductScreens** — skjermbilder av produktet.
6. **Insights** — grafer/nøkkeltall som selger innsiktsdelen.
7. **ExploreStays** — kobling mot markedsplassen (`/hytter`).
8. **Integrations** — Airbnb, Booking, smartlåser osv.
9. **Testimonials** — kundesitater.
10. **PricingTable** — én plan: 399/mnd, 3 990/år, 14 dagers prøve, 0 % gjestegebyr.
11. **Faq** — vanlige spørsmål (pris, utbetaling, integrasjoner, support, oppstart).
12. **FinalCta** + **Footer**.
13. **ChatWidget** (context="landing") — AI-assistenten «Vera» svarer besøkende (se §10).

Alt er tema-bevisst (lyst/mørkt) og bygget på Verta-paletten (navy #081b33, gull #d8a66a, cloud #f5f7fa).

---

## 4. Autentisering & tilgang

- `/registrer`, `/login`, `/glemt-passord`, `/auth/reset-passord` — Supabase Auth.
- `/auth/callback`, `/auth/signout` — OAuth/utlogging.
- `/mfa` + `/dashboard/sikkerhet` — tofaktor (TOTP). Admin krever AAL2.
- **Onboarding**: `/onboarding` (opprett første eiendom) → `/onboarding/plan`
  (velg plan, måned/år, godta vilkår) → Stripe Checkout → `/onboarding/fullfort`
  (verifiserer sesjon, setter plan).

---

## 5. Dashboardet (`app/dashboard/`)

`layout.tsx` håndhever betalingsmuren og rendrer `DashboardNav`. Menyen står
ikke lenger permanent fremme: toppen viser «← Huset», Verta-merket og ÉN knapp —
**Alt** — som åpner hele modul-listen gruppert (`lib/nav-items.ts`, kanonisk
kilde delt med `/hjem/alt`). Ingen modul er fjernet; Smartlås, Skade og Boost
ble tvert imot nåbare fra menyen for første gang.

Den rolige inngangen ligger på **`/hjem`** (se §5b). Meny-grupper:

### Topp
- **Oversikt** (`/dashboard`) — KPI-er (inntekt mnd, beleggsgrad, kommende, inntekt i år), inntektsgraf (12 mnd), kommende bookinger, oppgaver, bookinger per kilde. **Røde varsler øverst**: åpne bookingforespørsler (blinkende) og kritiske penge-hendelser (refusjons-svikt / foreldreløse betalinger).
- **Eiendommer** (`/dashboard/properties`, `[id]`, `new`) — hjertet i systemet (se §6).
- **Eiendomsøkonomi** (`/dashboard/okonomi`) — verdi/lån/egenkapital/belåningsgrad/kontantstrøm, redigeres her; undersider: `inntekter`, `kostnader`, `eierskap` (medeiere + oppgjør), `historikk` (hendelseslogg), `bankrapport`.

### Drift
- **Meldinger** (`/dashboard/meldinger`) — gjestemeldinger med AI-svarforslag.
- **Varsler** (`/dashboard/varsler`) — tomme datoer / lavt belegg med ferdige kampanjeforslag.
- **Rengjøring** (`/dashboard/rengjoring`) — utvask-oppgaver (auto-opprettet ved utsjekk) + vasker-portal.
- **Finn vaskehjelp** (`/dashboard/finn-vaskehjelp`) — markedsplass for vaskere: send oppdrag, betal (destination charge, Verta 10 %), anmeld, refunder.
- **Vedlikehold** (`/dashboard/vedlikehold`) — vedlikeholdssaker; håndverker-portal (`/handverker/[token]`).
- **Lager** (`/dashboard/lager`) — forbruksvarer/handleliste med varsler.

### Marked
- **Prising** (`/dashboard/prising`) — AI-prisforslag + sesongpriser.
- **Boost** (`/dashboard/boosts`, `new`, `[id]`) — betalt markedsføring på Vertas sosiale kanaler.

### Økonomi
- **Utgifter** (`/dashboard/utgifter`) — utgiftssporing (mates inn i eiendomsøkonomi + skatt).
- **Provisjon** (`/dashboard/commissions`) — provisjonsoversikt per bookingkilde.
- **Skatt** (`/dashboard/tax`) — norsk skatterapport (grunnlag fylles automatisk).

### Konto
- **Team** (`/dashboard/team`) — inviter co-host/forvalter (`/team/aksepter/[token]`).
- **Sikkerhet** (`/dashboard/sikkerhet`) — passord + tofaktor.
- **Innstillinger** (`/dashboard/settings`) — abonnement (Customer Portal, kjøp ekstra eiendom), utbetaling (Stripe Connect-onboarding), slett konto.

### Admin (kun ADMIN_EMAILS, `app/admin/`)
- `/admin` — plattformtall (brukere, MRR, eiendommer, bookinger, boost, provisjon).
- `/admin/kanaler` — sosiale kanaler for boost.
- `/admin/nyhetsbrev` — abonnent-arkiv + skriv/send nyhetsbrev (test + bekreftelse + logg).

---

## 5b. Huset (`app/hjem/`) — den rolige inngangen

Et presentasjonslag over dashbordet, ikke et nytt system: **kun lesing**, ingen
ny tabell, ingen endret logikk. Loadere i `lib/hus.ts`. Egen layout med samme
betalingsmur-vakt som dashbordet, og aksebaren `HusAkser` nederst.

Hele navigasjonen er fire ord:

- **`/hjem`** — startsiden. Boligens eget bilde, én hilsen og ÉN ting som
  fortjener deg nå (`loadHusetNa`, streng prioritet: ubesvart forespørsel →
  kritisk pengevarsel → usendt gjestelenke → vask uten vasker → neste innsjekk).
  Ingenting som haster ⇒ «Alt er i orden», og skjermen får være tom.
- **`/hjem/rom`** — boligen innvendig som plantegning (`loadHusplan`). Åtte soner
  + tre skuffer, matet av `house_equipment` (plassert via `location`/`category`,
  med alder og utløpt garanti), `properties.access_info` + `smart_locks`,
  `supplies`, `property_events`, `property_contacts`, `incident_claims`. Åpne
  `maintenance_requests` vises som bånd under planen.
- **`/hjem/tid`** — 90 døgn som en elv (`loadElv`). Opphold som bånd (forespørsler
  stiplet), tomme netter som hull priset av `base_nightly_rate` + `seasonal_rates`
  (samme regel som `lib/pricing.ts`), vask langs bredden. «Hvorfor?» forklarer
  regnestykket i klartekst.
- **`/hjem/ord`** — Vera i fullskjerm mot eksisterende `/api/chat` (`portal`).
- **`/hjem/alt`** — hele modul-listen, gruppert og søkbar (`lib/nav-items.ts`).
- **`/hjem/historie`** — husets biografi (`loadBiografi`): hva boligen har tjent
  siden dag én, hvor mange som har bodd her, og en tidslinje år for år bygget av
  `property_events`, løste `maintenance_requests` (med kostnad), utstyrskjøp,
  `expenses` og `property_reviews`. Har egen `@media print` (hvitt papir, svart
  tekst) fordi siden er ment å skrives ut og gis til en kjøper. Nås fra
  Historikk-skuffen i Rom.

**Nøkkelknippet** (`sql/064_property_keys.sql` — **må kjøres i Supabase**):
`property_keys` med etikett, type, antall, og «hvem har den nå». Kort på
eiendomssiden (legg til / flytt holder / fjern, `addKey` · `updateKeyHolder` ·
`deleteKey`) og egen skuff i Rom. En nøkkel uten holder lyser — det er nettopp
den du ikke finner. Koden tåler at migrasjonen ikke er kjørt: da er skuffen tom.

**Innloggingen lander i huset.** Alle veier inn peker nå på `/hjem`: passord-
innlogging (`app/login/actions.ts`), magic link/OAuth-callback, passord-reset,
fullført onboarding, Stripe-retur (`/onboarding/fullfort`), aksept av co-host-
invitasjon, og PWA-ens `start_url`. Nye brukere uten eiendom går fortsatt til
`/onboarding` først, og betalingsmuren gjelder som før.

Startsiden har **levende lys**: `data-lys` settes etter montering fra brukerens
faktiske årstid og klokkeslett (vinternatt dyp og blå, sommerformiddag høy og
gyllen). Skrives rett på elementet via ref, ikke via state, så server og
nettleser aldri er uenige om hva klokka er.

---

## 6. Eiendomssiden (`/dashboard/properties/[id]`) — funksjonssentrum

Her ligger de fleste funksjonene, som «kort»:

- **Rediger eiendom** — navn, adresse (autocomplete + Geonorge-geokoding), rom/senger, fasiliteter (nedtrekkbare grupper), WiFi, husregler, tilkomst, priser, bookingmodus (instant/forespørsel), «slik funker det».
- **Offentlig annonse** — AI-generert annonsetekst + områdebeskrivelse (`/bo/[slug]`), listet-på-markedsplass-bryter.
- **Bilder** (ImageManager) + **Video** (Mux-lignende opplasting).
- **Kart** — Leaflet med geokodet posisjon.
- **Gjesteguide** — delbar lenke `/guide/[token]` (kopierbar).
- **Utstyrs-liste** — apparater med merke/modell (AI forklarer bruken til gjestene).
- **Utleie av utstyr** — sykler/ski/kajakk med døgnpris + rabatt på ekstra døgn; betalte leier + refunder-knapp.
- **Tjenester** — pool/badstamp/brøyting/vask: fast tidsplan (AI svarer) eller på bestilling (rutes til leverandør). Egne **tjeneste-forespørsler** med ett-trykks WhatsApp/SMS/e-post til leverandør.
- **Faste kontakter** — hyttefolk (snekker/brøyting) med Ring/SMS/WhatsApp/E-post.
- **Lokale lenker** — matvarelevering m.m. vist i guiden.
- **Sen utsjekk / tidlig innsjekk** — betalt oppsalg (pris settes her).
- **Smartlås** — koble Nuki/Seam; adgangskode per booking.
- **Kalender** — tilgjengelighet + iCal-import (Airbnb/Booking, toveis).
- **Bookinger** — liste + registrer manuelt (Airbnb/Booking) + kopierbar gjestelenke; godkjenn/avslå forespørsler; avbestill/refunder; meld skade.

---

## 7. Gjeste- og partnerflater (token-portaler)

Ingen innlogging — UUID-token er nøkkelen:

- **`/bo/[slug]`** — offentlig, Airbnb-lignende boligside med bilder, kart, fasiliteter, anmeldelser, booking-skjema (instant eller forespørsel).
- **`/guide/[token]`** — delbar gjesteguide (også for Airbnb-gjester): AI-concierge på gjestens språk, WiFi, tilkomst, «slik funker det», husregler, tjenester, utleie av utstyr, lokale lenker, POI-er/kart, kontakt verten, nyhetsbrev-påmelding.
- **`/gjest/[token]`** — per-booking gjesteside: oppholdsinfo, adgangskode, restbetaling, sen utsjekk/tidlig innsjekk, anmeldelse, avbestilling.
- **`/godkjenn/[token]`** — eier godkjenner bookingforespørsel fra e-post.
- **`/krav/[token]`** — gjest betaler skadekrav.
- **`/vasker/[token]`** — vasker-portal (se oppdrag, koble utbetaling).
- **`/handverker/[token]`** — håndverker-portal (vedlikeholdssaker).
- **`/avmelding/[token]`** — nyhetsbrev-avmelding.
- **`/team/aksepter/[token]`** — aksepter team-invitasjon.

**Markedsplass:** `/hytter` (oversikt over listede boliger) + `/bo/[slug]`.

---

## 8. Betaling & Stripe

To Connect-modeller:
- **Direct charges** (eier-bookinger, depositum/rest, skadekrav, sen utsjekk/tidlig innsjekk): sesjon på **eierens** tilkoblede konto (`{ stripeAccount }`), gjesten betaler eieren direkte, **0 % til Verta**. Refusjon på eierens konto.
- **Destination charges** (vask + utstyrsutleie): sesjon på **plattformen** med `application_fee_amount` (Verta 10 %, minst 3 kr) + `transfer_data.destination`. Refusjon med `reverse_transfer` + `refund_application_fee` (helper i `lib/refunds.ts`) så Verta aldri taper.
- **Abonnement**: vanlig Stripe-abonnement (premium + ekstra eiendom), måned eller år.

**Webhook** (`app/api/stripe/webhook`): to destinasjoner (Your account + Connected accounts), godtar **to signing secrets**. Grener på `metadata.kind`: claim, rental, service, stay_extra, remaining, ellers booking. Idempotente status-guards. **Sikkerhetsnett**: betaling uten match → kritisk varsel. Abonnementstilstand + MRR regnes på nytt fra alle kundens abonnementer.

Sentrale filer: `lib/stripe.ts`, `lib/booking.ts` (finalize/cancelAndRefund), `lib/refunds.ts`, `lib/commissions.ts`, `lib/cancellation.ts` (refusjonspolicy).

---

## 9. AI-funksjoner (Anthropic Claude)

- **Modeller**: `DEFAULT_MODEL` = Sonnet (cachet generering: annonsetekst, områdebeskrivelse, reiseguide); `CHAT_MODEL` = **Haiku 4.5** (høyvolums chat — billig).
- **«Vera»** (`app/api/chat`) — assistent på landingsside + portal.
- **Gjeste-concierge** (`app/api/guide/[token]/chat`) — svarer gjesten på deres eget språk, kun fra boligens fakta + utstyr (merke/modell) + tjenester (tidsplan). **Rate-limitet** (8/min, 120/døgn per token), input-tak, lagrer ikke innhold.
- **Svarforslag** på gjestemeldinger og anmeldelser; **prisforslag**; **markedsføringstekst**.
- Kjernefiler: `lib/ai.ts`, `lib/anthropic.ts`, `lib/listing.ts`.

---

## 10. Cron-jobber (`app/api/cron/*`, `vercel.json`, `CRON_SECRET`)

`ical-sync`, `cleaning-tasks`, `empty-dates` (tomme datoer-varsler), `remaining-reminders` (restbetaling), `release-holds` (frigi utløpte reservasjoner), `commissions`, `opprydding`, `rapporter-bruk` (bruk til kontrollrom), `heartbeat`.

---

## 11. Datamodell (migrasjoner → funksjon)

SQL i `sql/NNN_*.sql` (idempotente). Nyere/viktige:
- 040 service_fee · 041 owner_token · 042 incident_claims · 043 property_listed · 044 cleaner_payouts · 045 incident_photos · 046 owner_direct_charges · 047 dba_signed · 048 guest_guide
- 049 rentals · 050 house_equipment · 051 rental_daily_pricing · 052 guide_chat_limits · 053 refund_tracking · 054 critical_alerts · 055 user_mrr
- 056 contacts+local_links · 057 stay_extras · 058 newsletter · 059 property_services · 060 newsletter_campaigns

---

## 12. Integrasjoner

- **Kalender**: iCal toveis (Airbnb/Booking) — `lib/ical*.ts`, `app/api/calendar/[slug]`.
- **Smartlås**: Seam (`lib/seam.ts`) + Nuki (`lib/nuki.ts`), OAuth-callback.
- **E-post**: Resend (`lib/email.ts`) — alle transaksjons- og nyhetsbrev-e-poster.
- **Betaling**: Stripe (+ Vipps forberedt men pauset, `lib/vipps.ts`).
- **Overvåking**: eksternt kontrollrom (`lib/kontrollrom.ts`) — hendelser + heartbeat + brukrapport.
- **Kart/geokoding**: Leaflet + Geonorge (`lib/geocode.ts`, `lib/pois.ts`).

---

## 13. Nøkkel-lib-moduler

`auth.ts` (sesjon/profil) · `admin.ts` (admin + metrics) · `constants.ts` (planer,
priser, gebyrer) · `stripe.ts` · `booking.ts` / `booking-requests.ts` ·
`refunds.ts` · `cancellation.ts` · `pricing.ts` · `availability.ts` ·
`okonomi.ts` · `tax.ts` · `email.ts` · `ai.ts` / `anthropic.ts` / `listing.ts` ·
`newsletter.ts` · `critical-alerts.ts` · `audit.ts` · `validation.ts` (zod) ·
`types.ts`.

---

## 14. Miljøvariabler (Vercel)

Supabase (URL, ANON, SERVICE_ROLE) · Stripe (SECRET, WEBHOOK_SECRET,
WEBHOOK_SECRET_CONNECT, 4× PRICE_*) · ANTHROPIC_API_KEY · RESEND_API_KEY,
EMAIL_FROM · NEXT_PUBLIC_SITE_URL · ADMIN_EMAILS · CRON_SECRET ·
(valgfritt) KONTROLLROM_*, NUKI_API_TOKEN, SEAM_API_KEY, VIPPS_*.

---

## 15. Kjent, ufarlig byggfeil

`next build` feiler kun på prerender av `/auth/reset-passord` (mangler Supabase-
env under build). Uendret — ignoreres.

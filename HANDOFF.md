# Overlevering — hvor vi står (16. juli 2026)

Kort statusnotat for å fortsette arbeidet fra en annen maskin. Les dette + de
siste commitene (`git log --oneline -25`) for full kontekst.

## Bygget nylig (alt pushet til main)
Norge-utbyggingen av gjesteguiden — alt additivt, ingen eksisterende funksjon endret:

- **Faste kontakter** — eierens hyttefolk (snekker/brøyting/vaktmester) med ett-trykks Ring/SMS/WhatsApp/E-post. `sql/056`
- **Lokale lenker** — matvarelevering m.m. i guiden + ansvarsfraskrivelse. `sql/056`
- **Sen utsjekk / tidlig innsjekk** — betalt oppsalg, direct charge til eier, sjekket mot kalenderen. `sql/057`
- **Post-booking-lenke** — kopierbar gjestelenke for Airbnb/Booking-gjester (ingen SQL)
- **Nyhetsbrev** — samtykke-påmelding i guiden, admin-arkiv, avmelding, og utsending via Resend. `sql/058`, `sql/060`
- **AI→tjeneste-motoren** — eier definerer tjenester (pool/badstamp/brøyting/vask); AI svarer tidsplan eller ruter på-bestilling til leverandør via ett-trykks WhatsApp/SMS/e-post. `sql/059`

Tidligere i økten: betalingssikkerhet (refusjons-korrekthet, gratis-booking-hull, trygg market-refusjon, sikkerhetsnett for foreldreløse betalinger), eksakt MRR for årskunder, minimums-gebyr på marked, årlig ekstra eiendom, prissynk overalt.

## MÅ GJØRES — migrasjoner i Supabase
Kjør SQL-filene fra `sql/` som ikke alt er kjørt. **Alle er idempotente** (`if not exists` osv.), så det er trygt å kjøre hele settet `049`–`060` på nytt om du er usikker.

- Bekreftet kjørt tidligere: 049–055, 058, 059
- Verifiser/kjør: **056, 057, 060** (og evt. andre du er usikker på)

## MÅ GJØRES — Stripe / go-live (kun du kan)
Se go-live-sjekklista fra samtalen. Kritisk gjenstående:
1. Bekreft at **begge** webhook-destinasjonene virker (Your account + Connected accounts) og at begge signing secrets ligger i Vercel (`STRIPE_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET_CONNECT`).
2. Prisene i Vercel peker på **live** `price_…`: `STRIPE_PRICE_PREMIUM` (399/mnd), `STRIPE_PRICE_PREMIUM_YEARLY` (3 990/år), `STRIPE_PRICE_EXTRA_PROPERTY` (199/mnd), `STRIPE_PRICE_EXTRA_PROPERTY_YEARLY` (1 990/år).
3. Aktiver **Customer Portal** i live · slå på **betalingsmetoder** · verifiser plattformkonto + bank.
4. **Ekte live-test:** booking (25 kr) → betaling → bekreftet + adgangskode → avbestilling → refusjon. Så guide + AI + en utleie med Refunder-knapp.

## Gjenstår å bygge (valgfritt)
- Ekte manual-oppslag (PDF per apparat-modell), QR-kode på guiden, nullstill guide-token.
- Flytt nyhetsbrev-utsending til kø/cron hvis lista blir stor.
- Ferdig juridisk tekst på /vilkar, /personvern, /databehandleravtale (AI-avsnitt flagget for jurist) + Anthropic DPA/zero-retention.

## Kjent, ufarlig byggfeil
`next build` feiler kun på prerender av `/auth/reset-passord` (mangler Supabase-env under build). Uendret hele økten — ignorer den.

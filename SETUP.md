# Verta — oppsett av Stripe og Vipps

All koden er på plass. Dette er stegene **du** må gjøre (kontoer + nøkler).
Legg nøklene både i `.env.local` (lokalt) og i Vercel → Project Settings →
Environment Variables (produksjon).

---

## Stripe (abonnement)

1. Opprett konto på https://dashboard.stripe.com (start i **Test mode**).
2. **Lag 4 produkter** (Products → Add product), hver med en månedlig pris (NOK):
   - Basis — 149 kr/mnd
   - Pluss — 249 kr/mnd
   - Premium — 349 kr/mnd
   - Ekstra eiendom — 99 kr/mnd
   Kopier **Price-ID** (`price_…`) for hver.
3. Hent API-nøkler (Developers → API keys): `Secret key` og `Publishable key`.
4. **Webhook** (Developers → Webhooks → Add endpoint):
   - URL: `https://<ditt-domene>/api/stripe/webhook`
   - Events: `customer.subscription.created`, `…updated`, `…deleted`
   - Kopier **Signing secret** (`whsec_…`).
5. Fyll inn env-variabler:
   ```
   STRIPE_SECRET_KEY=sk_test_…
   STRIPE_PUBLISHABLE_KEY=pk_test_…
   STRIPE_WEBHOOK_SECRET=whsec_…
   STRIPE_PRICE_BASIS=price_…
   STRIPE_PRICE_PLUSS=price_…
   STRIPE_PRICE_PREMIUM=price_…
   STRIPE_PRICE_EXTRA_PROPERTY=price_…
   ```
6. Lokalt kan du teste webhooken med Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

Da: onboarding → planvalg går via ekte Stripe Checkout, og
`/dashboard/settings` får «Administrer abonnement» + «Kjøp ekstra eiendom».

---

## Vipps — innlogging (OIDC via Supabase)

1. Skaff Vipps Login-tilgang i https://portal.vipps.no (Utvikler → nøkler).
   Du trenger `client_id` og `client_secret`.
2. I **Supabase Dashboard** → Authentication → Providers → **Add custom OIDC**:
   - Identifier: `custom:vipps`
   - Issuer URL (test): `https://apitest.vipps.no/access-management-1.0/access/`
     (produksjon: `https://api.vipps.no/access-management-1.0/access/`)
   - Client ID / Client Secret: fra Vipps
   - Scopes: `openid name email phoneNumber` (IKKE `nin` — vi lagrer ikke SSN)
3. Sett `NEXT_PUBLIC_VIPPS_ENABLED=true` → innloggingsknappen vises.
   E-post-magic-link finnes fortsatt som fallback.

---

## Vipps — boost-betaling (ePayment)

1. I Vipps-portalen, skaff ePayment-tilgang. Du trenger:
   `client_id`, `client_secret`, `Ocp-Apim-Subscription-Key`, og
   `Merchant Serial Number (MSN)`.
2. Fyll inn:
   ```
   VIPPS_CLIENT_ID=…
   VIPPS_CLIENT_SECRET=…
   VIPPS_SUBSCRIPTION_KEY=…
   VIPPS_MSN=…
   VIPPS_API_BASE=https://apitest.vipps.no   # produksjon: https://api.vipps.no
   ```
3. Når disse finnes, bruker «Godkjenn og betal med Vipps» på en boost ekte
   ePayment. Brukeren sendes til Vipps, og `/api/vipps/return` bekrefter og
   aktiverer boosten.

> **NB:** Vipps-betalingskoden er skrevet mot det offisielle ePayment-API-et,
> men er ikke kjøre-testet uten ekte nøkler. Test først i Vipps' testmiljø
> (`apitest.vipps.no`) før produksjon.

---

## Vercel (produksjon)

Husk å legge **alle** env-variablene fra `.env.local` inn i Vercel
(Project Settings → Environment Variables), og sett `NEXT_PUBLIC_SITE_URL`
til ditt Vercel-domene. Ellers krasjer Supabase/Stripe/Vipps i produksjon.

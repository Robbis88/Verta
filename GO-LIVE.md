# Verta — Go-live sjekkliste

Alt du trenger for å få Verta live på **verta.no**. Detaljerte oppsett for
Stripe/Vipps finnes i `SETUP.md`.

---

## 1. Domene (verta.no)

- [ ] Vercel → prosjekt **Verta** → Settings → **Domains** → legg til `verta.no` og `www.verta.no`
- [ ] Hos registraren (DNS): sett verdiene Vercel viser. Typisk:
  - A-record `@` → `76.76.21.21`
  - CNAME `www` → `cname.vercel-dns.com`
- [ ] Vent på DNS + automatisk SSL (kan ta litt tid)

---

## 2. Miljøvariabler i Vercel

Settings → **Environment Variables** (Production). De samme som i `.env.local`.

### Må være satt for at appen skal fungere
| Variabel | Verdi / hvor |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (hemmelig!) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `NEXT_PUBLIC_SITE_URL` | `https://verta.no` |
| `ADMIN_EMAILS` | `robert@kelsarbil.no` |
| `CRON_SECRET` | (generert lang streng) |

### Når du aktiverer betaling / ekstra
| Variabel | For |
|----------|-----|
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Abonnement |
| `STRIPE_PRICE_BASIS/PLUSS/PREMIUM/EXTRA_PROPERTY` | Plan-priser |
| `RESEND_API_KEY` | E-post (senere) |
| `VIPPS_CLIENT_ID/SECRET/SUBSCRIPTION_KEY/MSN` | Vipps innlogging + betaling |
| `VIPPS_API_BASE` | `https://api.vipps.no` (prod) |
| `NEXT_PUBLIC_VIPPS_ENABLED` | `true` når Vipps er klar |
| `NUKI_API_TOKEN` | Smartlås (Premium) |

> Etter endring av env-variabler: **Redeploy**.

---

## 3. Supabase Auth (kritisk for innlogging)

Authentication → **URL Configuration**:
- [ ] Site URL: `https://verta.no`
- [ ] Redirect URLs: `https://verta.no/**` og `https://verta.no/auth/callback`
- [ ] (Behold `http://localhost:3000/**` for lokal utvikling)

---

## 4. Database

- [x] `sql/001`–`006` kjørt i Supabase SQL Editor
- Ved nye migrasjoner: kjør neste `sql/NNN_*.sql`-fil

---

## 5. Stripe (når klar) — se SETUP.md

- [ ] Konto + 4 produkter (Basis/Pluss/Premium/Ekstra eiendom)
- [ ] Webhook → `https://verta.no/api/stripe/webhook`
- [ ] Lim price-IDer + nøkler i Vercel

## 6. Vipps (når klar) — se SETUP.md

- [ ] Login: custom OIDC `custom:vipps` i Supabase + `NEXT_PUBLIC_VIPPS_ENABLED=true`
- [ ] ePayment: nøkler i Vercel, test først på `apitest.vipps.no`

---

## 7. Verifiser etter deploy

- [ ] `https://verta.no` laster (landingsside med bilder + marquee)
- [ ] Innlogging via e-post-lenke fungerer → havner på `/dashboard`
- [ ] Opprett eiendom → vises i dashboard
- [ ] `/admin` åpnes for din e-post (andre får 404)
- [ ] iCal-feed: `https://verta.no/api/calendar/<slug>` gir en `.ics`
- [ ] (Stripe/Vipps når aktivert: test checkout/betaling i testmodus)

---

## Cron-jobber (kjører automatisk på Vercel)

| Jobb | Tidspunkt | Hva |
|------|-----------|-----|
| `/api/cron/commissions` | 1. hver måned 06:00 | Beregner provisjon |
| `/api/cron/ical-sync` | Daglig 05:00 | Importerer Airbnb/Booking-kalendere |

Begge beskyttet med `CRON_SECRET`.

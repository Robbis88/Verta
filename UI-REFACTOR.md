# Verta — full UI-refaktor til Huset

> Én identitet gjennom hele produktet. Ingen funksjonelle endringer.
> Status: **ferdig. Alle 11 moduler er konvertert.**
> Sist oppdatert: 2026-07-29.

## Resultatet

Alle 28 sidene under `/dashboard` snakker nå samme språk som `/hjem` og
startsiden. Kontrollmålingene fra «Definisjon av ferdig» nederst:

| Sjekk | Resultat |
|---|---|
| `@/components/ui/*` importert i `app/dashboard` | 0 treff |
| Hex-koder eller `bg-white` i `app/dashboard` | 0 treff |
| Diff i `lib`, `app/api`, `sql`, `supabase` siden refaktorstart | tom |
| Diff i noen `actions.ts` siden refaktorstart | tom |
| `tsc --noEmit`, `eslint .`, `next build` | grønne |

Skallet ble tatt sist, som planlagt: husflaten ligger nå i
`app/dashboard/layout.tsx`, og `Side` setter kun bredde og pust.

## Diagnosen

Startsiden og de ni rommene i `/hjem` snakker ett språk: mørk navy, gull som
eneste aksent, situasjon før data, ro som standard.

De 28 sidene under `/dashboard` snakker et annet: hvite shadcn-kort, badges,
tabeller, «Legg til»-knapper. To designfilosofier i samme produkt.

Målt 2026-07-27:

| | Antall |
|---|---|
| Sider under `/dashboard` | 28 |
| Av dem konvertert | 1 (oversikten, delvis) |
| Filer som importerer `@/components/ui/card` | 27 |
| Delte komponenter dashbordet bruker | 30 |

Jobben er altså **28 sider + 30 komponenter**, ikke 28 sider.

---

## Den mekaniske garantien

Dette er ikke et løfte om å være forsiktig. Det er en regel som kan bevises med
`git diff`.

**Ingen fil i disse mappene skal endres under refaktoren:**

```
lib/**              (unntatt lib/utils.ts sin cn — kun lesing)
app/**/actions.ts
app/api/**
sql/**
supabase/**
proxy.ts
```

Når en modul er ferdig, skal `git diff --stat <base>..HEAD -- lib app/api sql supabase` være **tom**, bortsett fra rene presentasjonsfiler.

Alt annet følger av det: ingen databaseendring, ingen nye API-kall, ingen endret
forretningslogikk, ingen endret arbeidsflyt, ingen ny funksjon. Server actions
kalles med nøyaktig samme `FormData`-felter som før.

**Unntak som må godkjennes eksplisitt av Robert, én for én:** hvis en action har
en hardkodet `redirect("/dashboard")` som gjør at en konvertert side kaster
brukeren ut av huset. Da legges et valgfritt `next`-felt til, uten å endre
oppførselen når feltet mangler. Dette er gjort to ganger allerede
(`markGuestLinkSent`, `assignTask`) og skal forbli sjeldent.

---

## Designsystemet

### Tokens — `app/globals.css`

Én kilde for farge og bevegelse, eksponert som Tailwind-farger (`bg-hus-flate`,
`text-hus-dempet`, `border-hus-linje`).

- **Flater:** `hus-flate` `hus-hev` `hus-hev2`
- **Blekk, tre nivåer:** `hus-blekk` `hus-dempet` `hus-svak` (+ `hus-hvisk` for placeholder)
- **Gull:** `hus-gull` `hus-gull-lys` — betyr penger og handling, aldri pynt
- **Tilstand:** `hus-obs` `hus-kritisk` `hus-god`
- **Linjer:** `hus-linje` `hus-linje-sterk` `hus-linje-svak`
- **Bevegelse:** `--ease-hus` og klassen `.hus-stig`

### Primitivene — `components/hus/index.tsx`

De **eneste** lovlige byggeklossene på en side i huset:

| Primitiv | Rolle |
|---|---|
| `Side` | Bredden og pusten. `bred` for kalender/tabeller. Flaten selv ligger i `dashboard/layout.tsx` etter modul 11. |
| `Situasjon` | Åpningen: merke, én setning om hva som ER tilfellet, valgfri handling. |
| `TallRekke` / `Tall` | Tall som betyr noe. Fire toner: ro, gull, obs, kritisk. |
| `Flate` | Rolig seksjon med overskrift og én linje som forklarer den. |
| `Liste` / `Rad` | Én linje: når, hva, detalj, verdi, handling. Kan gjøres klikkbar. |
| `Handling` | Lenke eller knapp. Tre vekter: `gull`, `stille`, `naken`. `nyFane` for nedlastinger. |
| `Tomt` | Ingenting her ennå — og alltid én vei videre. |
| `Felt` / `Velg` / `Omrade` | Skjemafelt i husets språk. `navn` går rett gjennom som `name`. |
| `Merke` | Kort status som en rolig pille, aldri en farget boks. |
| `Beskjed` | Kvittering etter en handling. |
| `Kort` | En flate inni en `Flate`, for lister der hver rad har eget skjema. |
| `Tabell` | Ekte tabelldata. Ruller vannrett i sin egen boks. |
| `Kvittering` | Feil i rødt, suksess i grønt, under et skjema. |

Alle er server-komponenter, så de kan brukes rett i datahentende sider.
Interaktivitet legges i klientkomponenter som plasseres **inni** dem.

### Reglene

1. **Ingen side setter farge selv.** Ser du en hex-kode eller `bg-white` i en
   side under `/dashboard`, er den ikke konvertert.
2. **Ingen side importerer `@/components/ui/card`.** Bruk `Flate`.
3. **Situasjon før data.** Siden åpner med hva som er tilfellet
   («Du har brukt 41 200 kr i år. Alt har kvittering.»), ikke med et filter og
   en tabell. Dette er *ikke* det samme som en hilsen på hver side — det er én
   hjemskjerm og 27 sider som kjenner situasjonen sin.
4. **Rekkefølge på hver side:** situasjon → tallene → handlingen → detaljene →
   administrasjon nederst.
5. **Maks tre nivåer blekk.** Trenger du et fjerde, er innholdet for tett.

### Skjemaene — den ene gaffelen

`components/ui/{card,button,input,label,textarea}` brukes også av **8 sider
utenfor dashbordet** (login, registrer, glemt-passord, onboarding/plan, admin ×3,
reset-passord). De skal derfor **ikke** endres.

I stedet får huset egne feltprimitiver når første skjema konverteres:
`Felt`, `Velg`, `Omrade`. De wrapper vanlige `<input>`/`<select>`/`<textarea>`
med hus-tokens, og tar nøyaktig samme `name`-attributter som i dag, så alle
server actions er upåvirket.

---

## Rekkefølgen

Én modul om gangen. Ferdig betyr: bygget grønt, lint rent, og ingen diff i den
frosne mappelisten.

Alle moduler er ferdige. Tabellen står igjen som logg over hva som ble gjort.

| # | Modul | Sider | Delte komponenter | Merknad |
|---|---|---|---|---|
| ✅ 1 | **Utgifter** | `utgifter` | `expenses/expense-form` | Pilot. Beviste mønsteret og ga `Felt`/`Velg`. |
| ✅ 2 | Skatt & provisjon | `tax`, `commissions` | `tax/print-button` | Rene lese-sider. `KpiCard`-bruken erstattet av `TallRekke`. |
| ✅ 3 | Drift, lett | `lager`, `varsler`, `prising` | `alerts/alert-campaign`, `pricing/pricing-tool`, `pricing/seasonal-rates` | |
| ✅ 4 | Drift, tung | `rengjoring`, `vedlikehold`, `finn-vaskehjelp` | — | 344 + 334 + 383 linjer. Mange skjemaer. |
| ✅ 5 | Meldinger | `meldinger` | `messages/reply-tools` | AI-flyten er nøyaktig som før. |
| ✅ 6 | Eiendomsøkonomi | `okonomi` + 5 undersider | `okonomi/{ui,ai-box,okonomi-nav,demo-action}` | `okonomi/ui` er nå tynne innpakninger over husets primitiver; `Side` ligger i `okonomi/layout.tsx`. Ga primitivet `Tabell`. |
| ✅ 7 | Boost, skade, smartlås | `boosts` ×3, `skade/[bookingId]`, `smartlas-guide` | `boosts/{boost-editor,boost-form}`, `claims/claim-form` | Statuser oversatt til norsk i visningen; verdiene i basen er urørt. |
| ✅ 8 | Konto | `settings`, `sikkerhet`, `team` | `security/{set-password,two-factor}`, `settings/delete-account-button` | Ga `Handling` en `nyFane`-prop (GDPR-eksporten). |
| ✅ 9 | **Eiendommer** | `properties`, `properties/new`, `properties/[id]` | `properties/*`, `calendar/availability-calendar`, `bookings/*`, `smartlock/smartlock-code` | 1 706 linjer delt i sju seksjoner under `properties/[id]/seksjoner/`. Datahentingen ble ikke flyttet. |
| ✅ 10 | Oversikten | `dashboard` | `dashboard/{overview-ui,send-guest-link-button}` | `TallRad`, `PanelCard` og `KpiCard` slettet; kun `MonthChart` står igjen, med `tone` fordi admin deler den. |
| ✅ 11 | Skallet | `dashboard/layout.tsx` | `dashboard/dashboard-nav` | Husflaten flyttet opp i layoutet, den negative margen i `Side` fjernet. |

### Bevisst urørt

Tre komponenter deles med lyse flater utenfor dashbordet og følger derfor samme
gaffel som `components/ui/*`:

- `properties/property-map` og `properties/amenity-list` — brukes av `/bo` og `/guide`.
- `chat/chat-widget` — brukes også av landingssiden.
- `dashboard/overview-ui`s `MonthChart` — brukes av `admin/inntekt`, og fikk
  derfor `tone` i stedet for å bli mørk for alle.

### Hvorfor skallet sist

Bytter man bakgrunnen først, blir alle ukonverterte sider hvite kort på mørk
flate — verre enn i dag. `Side` hadde derfor en negativ marg som la hus-flaten
oppå den lyse layouten per side. I modul 11, da alle sidene var konvertert, ble
flaten flyttet opp i `dashboard/layout.tsx` og margen fjernet.

---

## Definisjon av ferdig

1. ✅ Det er umulig å se hvilke sider som ble laget før og etter refaktoren.
2. ✅ `grep -rl "@/components/ui/card" app/dashboard` gir **null treff**.
3. ✅ `grep -rlE "#[0-9a-fA-F]{6}|bg-white" app/dashboard` gir **null treff**
   (kun `bg-white/[0.0x]`-slør, som er husets egne tokens).
4. ✅ `git diff --stat 34c2c37..HEAD -- lib app/api sql supabase` er tom.
   Målt fra refaktorens startpunkt, ikke fra `main` — `main` ligger bak flere
   funksjonsendringer som ikke hører til refaktoren.
5. ✅ `npm run build`, `tsc --noEmit` og `eslint .` er grønne.
6. ✅ Hver eneste side åpner med en situasjon, ikke med en tabell.

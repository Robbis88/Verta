# Verta — full UI-refaktor til Huset

> Én identitet gjennom hele produktet. Ingen funksjonelle endringer.
> Status: **designsystemet er bygget, sidene er ikke konvertert.**
> Sist oppdatert: 2026-07-27.

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
| `Side` | Flaten: bakgrunn, bredde, pust. `bred` for kalender/tabeller. |
| `Situasjon` | Åpningen: merke, én setning om hva som ER tilfellet, valgfri handling. |
| `TallRekke` / `Tall` | Tall som betyr noe. Fire toner: ro, gull, obs, kritisk. |
| `Flate` | Rolig seksjon med overskrift og én linje som forklarer den. |
| `Liste` / `Rad` | Én linje: når, hva, detalj, verdi, handling. Kan gjøres klikkbar. |
| `Handling` | Lenke eller knapp. Tre vekter: `gull`, `stille`, `naken`. |
| `Tomt` | Ingenting her ennå — og alltid én vei videre. |

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

| # | Modul | Sider | Delte komponenter | Merknad |
|---|---|---|---|---|
| **1** | **Utgifter** | `utgifter` | `expenses/expense-form` | Pilot. Liten og typisk: header + tall + skjema + liste. Beviser mønsteret og gir `Felt`/`Velg`. **Godkjennes av Robert før modul 2.** |
| 2 | Skatt & provisjon | `tax`, `commissions` | `tax/print-button` | Rene lese-sider. `KpiCard`-bruken erstattes av `TallRekke`. |
| 3 | Drift, lett | `lager`, `varsler`, `prising` | `alerts/alert-campaign`, `pricing/pricing-tool`, `pricing/seasonal-rates` | |
| 4 | Drift, tung | `rengjoring`, `vedlikehold`, `finn-vaskehjelp` | — | 344 + 334 + 383 linjer. Mange skjemaer. |
| 5 | Meldinger | `meldinger` | `messages/reply-tools` | AI-forslag; behold flyten nøyaktig. |
| 6 | Eiendomsøkonomi | `okonomi` + 5 undersider | `okonomi/{ui,ai-box,okonomi-nav,demo-action}` | `okonomi/ui` er et eget mini-designsystem som skal opp i husets. |
| 7 | Boost, skade, smartlås | `boosts` ×3, `skade/[bookingId]`, `smartlas-guide` | `boosts/{boost-editor,boost-form}`, `claims/claim-form` | |
| 8 | Konto | `settings`, `sikkerhet`, `team` | `security/{set-password,two-factor}`, `settings/delete-account-button` | |
| 9 | **Eiendommer** | `properties`, `properties/new`, `properties/[id]` | `properties/{property-form,image-manager,property-map,public-listing-editor,video-uploader,delete-property-button}`, `calendar/availability-calendar`, `bookings/*`, `smartlock/smartlock-code` | **1 706 linjer i én fil.** Tas til slutt og deles i seksjonskomponenter underveis — uten å endre hva de gjør. |
| 10 | Oversikten | `dashboard` | `dashboard/overview-ui` | Delvis gjort. Fullføres når resten er på plass. |
| 11 | Skallet | `dashboard/layout.tsx` | — | Bakgrunn og ramme flyttes til hus-flaten. Tas **sist**, ellers ser ukonverterte sider ødelagte ut underveis. |

### Hvorfor skallet sist

Bytter man bakgrunnen først, blir alle ukonverterte sider hvite kort på mørk
flate — verre enn i dag. `Side`-primitivet har derfor en negativ marg som legger
hus-flaten oppå den lyse layouten per side. Når alle sidene er konvertert,
flyttes flaten opp i layoutet og margen fjernes.

---

## Definisjon av ferdig

1. Det er umulig å se hvilke sider som ble laget før og etter refaktoren.
2. `grep -rl "@/components/ui/card" app/dashboard` gir **null treff**.
3. `grep -rlE "#[0-9a-fA-F]{6}|bg-white" app/dashboard` gir **null treff**.
4. `git diff --stat main..HEAD -- lib app/api sql supabase` er tom.
5. `npm run build`, `tsc --noEmit` og `eslint` er grønne.
6. Hver eneste side åpner med en situasjon, ikke med en tabell.

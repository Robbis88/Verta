# Verta — Landingsside blåkopi (CRO + storytelling)

Redesign-blåkopi for landingssiden. **Kun frontend/UX/copy/salg** — ingen nye
funksjoner, ingen backend/DB/API-endringer. Alle seksjoner gjenbruker
komponenter som allerede finnes i `components/landing/`.

Rød tråd: **«Hytta di skal ikke være en jobb. Den skal jobbe for deg.»**
Emosjonell bue: **Kaos → Bedre måte → Pengene tilbake → Går av seg selv →
Full trygghet → Bevis → Handling.**

---

## Strategi

**1. Hva Verta egentlig selger (følelsen):** Ro i magen — hytta passer seg selv
og tjener penger uten å bli en ny jobb. En identitetsforvandling: fra stresset
amatør-vert til eier av en rolig, proff, lønnsom maskin. Og: *pengene er dine,
ikke Airbnbs.* Tre følelser: **ro, stolthet, «pengene er mine».**

**2. Hvem kunden er:** Vanlige nordmenn (45–65) som eier en verdifull ting som
har blitt en deltidsjobb. Den motvillige utleieren (arvet hytte), medeierne
(familie som deler), bihustleren (1–3 enheter). Ikke proffe forvaltere. Vil at
det bare skal virke.

**3. Hva kunden er redd for:** Kaos (dobbeltbooking, mas kl. 23), å tape penger
(Airbnb-kutt, skatt, skade uten dekning), å miste kontroll (nøkler, teknologi),
konflikt med medeiere, at det blir en ny jobb, å binde seg til enda et dyrt system.

**4. Hva kunden ønsker:** Ro (minst mulig gjestekontakt), beholde mer av
pengene, føle seg proff uten å jobbe som en, trygghet (oversikt + norsk skatt),
frihet til å bruke hytta selv, enkelhet. De kjøper **fritid og trygghet med god
samvittighet.**

**5. Hvorfor dagens side ikke treffer:** Funksjons-overskrift uten følelse;
primær-CTA var «Book demo» (mailto) i stedet for gratis oppstart; kronjuvelen
(0 % på leien) gjemt; funksjonsliste uten historie/fiende; ingen trygghet over
folden; sosialt bevis for sent; for mange seksjoner uten rød tråd.

---

## Wireframe (seksjon for seksjon)

Hver seksjon: mål · overskrift · undertittel · CTA · animasjon · følelse ·
komponent · hvorfor her.

1. **HERO** ✅ (bygget) — Løftet + 0 %-kroken + én knapp «Kom i gang gratis».
   `Hero`.
2. **FIENDEN** — «Å leie ut skulle gi frihet. Ikke en ny jobb.» Speiler kaoset
   (Airbnb-kutt, regneark, mas, skatt, medeier-krangel). Gjenkjennelse. `PainPoints`.
3. **VENDEPUNKTET** — «Verta gjør hytta til en maskin som passer seg selv.»
   Lettelse. Mørk→lys. `BeforeAfter` (brukes ikke i dag).
4. **PENGE-HISTORIEN** — «Airbnb tar 15–20 %. Verta tar 0 % av leien.»
   «Du beholder X mer»-teller. `Insights`/`DashboardPreview`.
5. **SLIK FUNKER DET** — «Oppe å kjøre samme dag.» 3 steg. Enkelhet. `HowItWorks`.
6. **GÅR AV SEG SELV** — «Gjestene får svar. Uten at du løfter en finger.»
   AI-guide + smartlås + vask. Ro/frihet. `ProductScreens` + `VideoSection`.
7. **FULL KONTROLL** — «Full oversikt. Null overraskelser.» Økonomi, skatt, delt
   eierskap, skadedekning. Trygghet. `FeatureGrid` + `DashboardPreview`.
8. **BEVIS** — «Norske hytteeiere sover bedre med Verta.» Sitater + tall.
   `Testimonials` + `LogoMarquee`/`Integrations`.
9. **PRIS** — «Én pris. Alt inkludert.» 399/mnd, 0 % på leien, 14 dager gratis.
   `PricingTable`.
10. **FAQ** — «Alt du lurer på.» Skatt, synk, sikkerhet, oppstart, oppsigelse.
    `Faq` + `ChatWidget`.
11. **SISTE CTA** — «La hytta begynne å jobbe for deg.» Speiler Hero. `FinalCta` + `Footer`.

**Rekkefølge i `app/page.tsx`:** Hero → PainPoints → BeforeAfter → Insights →
HowItWorks → ProductScreens/Video → FeatureGrid/DashboardPreview →
Testimonials/Integrations → PricingTable → Faq → FinalCta → Footer.

## Prinsipper (Apple/Linear/Stripe/Notion/Framer)
Én beskjed per seksjon · store flater, mye pust · store bilder/videoer · rolige
forskjøvne animasjoner (respekter `prefers-reduced-motion`) · lett å lese ·
mobil-først · gull kun som aksent på navy · ingen overdesign.

## Status
- ✅ Strategi · ✅ Komplett wireframe · ✅ Hero bygget (premium, ny video)
- ⏭️ Neste: bygg seksjonene 2→11 én om gangen, ikke videre før hver er perfekt.

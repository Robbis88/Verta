const faqs = [
  {
    q: "Hvordan kommer bookingene inn i Verta?",
    a: "Du kobler kalenderne fra Airbnb og Booking.com med toveis iCal-synk, og tar i tillegg imot direkte bookinger via din egen bookingside med bilder, kart og fasiliteter. Du velger selv: la gjesten betale direkte, eller godkjenn hver forespørsel med depositum. Alt samles i én kalender uten dobbeltbooking.",
  },
  {
    q: "Hvordan fungerer utbetalinger og økonomi?",
    a: "Gjesten betaler via Verta, pengene går rett til deg, og Verta tar en liten provisjon. Under Eiendomsøkonomi ser du hva hytta koster og tjener per måned, kvartal og år — resultat før og etter skatt, kontantstrøm, delt eierskap og en ferdig bankrapport. Grunnlaget til skatterapporten fylles ut automatisk.",
  },
  {
    q: "Hvilke integrasjoner støttes?",
    a: "Airbnb, Booking.com, Vrbo, Google Calendar og smartlåser (bl.a. Nuki, Igloohome, Yale og Salto). Flere kommer fortløpende.",
  },
  {
    q: "Hva slags support får jeg?",
    a: "Du får hjelp på e-post, og Premium har prioritert support. I tillegg finnes en innebygd assistent i appen som svarer på praktiske spørsmål.",
  },
  {
    q: "Hvor raskt kommer jeg i gang?",
    a: "De fleste er oppe samme dag: opprett konto, legg til eiendommen, koble kalenderne — så er du i gang. Book en demo, så viser vi deg hele oppsettet.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="bg-cloud px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Vanlige spørsmål
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-hairline bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-navy">
                {f.q}
                <span className="text-gold transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

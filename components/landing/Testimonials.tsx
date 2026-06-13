const cases = [
  {
    quote:
      "Jeg sluttet å bruke regneark. Nå ser jeg bookinger, inntekter og skatt på ett sted — sparer flere timer i uka.",
    name: "Ingrid Solheim",
    role: "Eier, 2 hytter i Hemsedal",
    result: "−6 timer admin / uke",
    initials: "IS",
  },
  {
    quote:
      "Direkte bookinger uten gebyr og automatiske adgangskoder har gjort utleien nesten selvgående.",
    name: "Marius Dahl",
    role: "Utleier, leilighet i Tromsø",
    result: "+22 % direkte bookinger",
    initials: "MD",
  },
  {
    quote:
      "Som forvalter trengte jeg oversikt over flere eiere. Verta gir meg kontroll på drift, vask og økonomi.",
    name: "Camilla Berg",
    role: "Forvalter, 9 ferieboliger",
    result: "9 enheter, én oversikt",
    initials: "CB",
  },
];

export function Testimonials() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Eiere og forvaltere som har fått kontroll
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cases.map((c) => (
            <div
              key={c.name}
              className="flex flex-col rounded-2xl border border-hairline bg-cloud p-7"
            >
              <p className="flex-1 text-[15px] leading-relaxed text-navy">
                «{c.quote}»
              </p>
              <span className="mt-6 w-fit rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                {c.result}
              </span>
              <div className="mt-5 flex items-center gap-3 border-t border-hairline pt-5">
                <span className="flex size-11 items-center justify-center rounded-full bg-navy text-sm font-bold text-gold">
                  {c.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">{c.name}</p>
                  <p className="text-xs text-ink/60">{c.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-ink/40">
          Illustrerende eksempler.
        </p>
      </div>
    </section>
  );
}

const integrations = [
  "Airbnb",
  "Booking.com",
  "Vrbo",
  "Google Calendar",
  "Smartlåser",
];

export function Integrations() {
  return (
    <section id="integrasjoner" className="bg-cloud px-6 py-24">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
          Bygget for moderne eiendomsforvaltning
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Verta kobler seg til verktøyene du allerede bruker — så alt spiller på
          lag.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {integrations.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-xl border border-hairline bg-white px-6 py-4 text-base font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="size-2 rounded-full bg-gold" />
              {name}
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-ink/60">
          Toveis kalendersynk, automatiske adgangskoder og mer — flere
          integrasjoner kommer fortløpende.
        </p>
      </div>
    </section>
  );
}

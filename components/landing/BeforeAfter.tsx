import { ArrowRight } from "lucide-react";

const scattered = ["Airbnb", "Booking.com", "Excel", "SMS", "E-post", "Papirer", "Notater", "Kalender"];

export function BeforeAfter() {
  return (
    <section className="bg-cloud px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Samle alt på ett sted
          </h2>
          <p className="mt-4 text-lg text-ink">
            Slutt å hoppe mellom apper, regneark og papirer. Verta samler hele
            driften i ett oversiktlig system.
          </p>
        </div>

        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* Før */}
          <div className="rounded-2xl border border-hairline bg-white p-7">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink/50">
              Før
            </p>
            <div className="flex flex-wrap gap-2.5">
              {scattered.map((s, i) => (
                <span
                  key={s}
                  className="rounded-lg border border-hairline bg-cloud px-3 py-2 text-sm text-ink"
                  style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg)` }}
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm text-ink/60">
              Spredt informasjon, dobbeltarbeid og lett å miste oversikten.
            </p>
          </div>

          {/* Pil */}
          <div className="flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-gold text-navy shadow-lg">
              <ArrowRight className="size-6" />
            </div>
          </div>

          {/* Etter */}
          <div className="rounded-2xl border-2 border-gold bg-navy p-7 text-white shadow-[0_20px_50px_rgba(8,27,51,0.25)]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gold-light">
              Etter
            </p>
            <p className="text-2xl font-bold">Verta</p>
            <p className="text-sm text-white/70">Én plattform · full oversikt</p>
            <ul className="mt-5 flex flex-col gap-2 text-sm text-white/80">
              <li>✓ Alle bookinger og kalendere samlet</li>
              <li>✓ Økonomi og skatt på autopilot</li>
              <li>✓ Gjester, vask og vedlikehold styrt ett sted</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/button";

const FEATURES = [
  "1 eiendom (+199 kr/mnd, eller 1 990/år, per ekstra)",
  "Bookingside uten gebyr — gjesten betaler deg direkte",
  "Kalender med Airbnb/Booking-synk",
  "AI-gjesteguide som svarer gjestene på alle språk",
  "Utleie av utstyr til gjestene (sykler, ski, kajakk)",
  "Multi-kanal + boost-annonsering",
  "Smartlås — Nuki, Igloohome & Salto",
  "Skatt-rapport + eiendomsøkonomi",
  "AI: annonsetekst, prising og assistent",
  "Vaske-marked, vedlikehold og lager",
];

export function PricingTable() {
  return (
    <section id="priser" className="bg-cloud px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-2 text-sm font-semibold tracking-wide text-gold">
            PRIS
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Én pris. Alt inkludert.
          </h2>
          <p className="text-lg text-ink">
            Ingen plan-nivåer, ingen provisjon på leien — gjestene dine betaler
            null plattformgebyr.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="relative rounded-2xl border-2 border-gold bg-white p-8 shadow-[0_12px_40px_rgba(216,166,106,0.18)]">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-sm font-semibold text-navy">
              Alt-i-ett
            </span>
            <h3 className="mb-2 text-2xl font-bold text-navy">Verta</h3>
            <p className="text-5xl font-bold text-gold">399 kr</p>
            <p className="text-ink">/mnd</p>
            <p className="mb-8 mt-1 text-sm text-ink/70">
              eller 3 990 kr/år (2 måneder gratis) · 14 dagers gratis prøve
            </p>

            <Button
              asChild
              className="mb-8 h-auto w-full rounded-lg bg-gold py-3 text-base font-semibold text-navy hover:bg-gold/90"
            >
              <Link href="/registrer">Kom i gang</Link>
            </Button>

            <ul className="space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  <span className="text-ink">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

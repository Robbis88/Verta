import { DashboardPreview } from "./DashboardPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy to-navy-dark">
      {/* subtil glød */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-gold-light">
            For eiere og forvaltere av ferieboliger
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Administrer ferieboliger fra én plattform
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">
            Samle bookinger, kalender, økonomi, dokumenter og
            gjestekommunikasjon på ett sted. Verta gir deg full oversikt over
            utleiedriften.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:hei@verta.no?subject=Book%20demo%20av%20Verta"
              className="rounded-lg bg-gold px-7 py-3.5 text-center text-base font-semibold text-navy transition hover:bg-gold/90"
            >
              Book demo
            </a>
            <a
              href="#funksjoner"
              className="rounded-lg border border-white/20 bg-white/5 px-7 py-3.5 text-center text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Se hvordan det fungerer
            </a>
          </div>
          <p className="mt-6 text-sm text-white/50">
            Norsk skatterapport · Smartlås · Direkte bookinger uten gebyr
          </p>
        </div>

        <div className="md:pl-4">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

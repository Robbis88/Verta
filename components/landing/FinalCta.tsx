export function FinalCta() {
  return (
    <section id="demo" className="relative overflow-hidden bg-gradient-to-b from-navy-dark to-navy px-6 py-24">
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Klar for enklere utleiedrift?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-white/70">
          Se hvordan Verta kan hjelpe deg med å få bedre kontroll over
          ferieboligene dine.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="mailto:hei@verta.no?subject=Book%20demo%20av%20Verta"
            className="rounded-lg bg-gold px-8 py-3.5 text-base font-semibold text-navy transition hover:bg-gold/90"
          >
            Book demo
          </a>
          <a
            href="mailto:hei@verta.no?subject=Kontakt%20Verta"
            className="rounded-lg border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            Kontakt oss
          </a>
        </div>
      </div>
    </section>
  );
}

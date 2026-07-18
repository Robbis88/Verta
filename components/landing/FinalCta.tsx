import Link from "next/link";

export function FinalCta() {
  return (
    <section
      id="demo"
      className="relative overflow-hidden bg-gradient-to-b from-navy-dark to-navy px-6 py-28"
    >
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/[0.07] blur-3xl" />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl">
          La hytta begynne å jobbe for deg.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg text-white/70">
          14 dager gratis. Ingen binding. Oppe å kjøre i dag.
        </p>
        <div className="mt-9 flex flex-col items-center gap-4">
          <Link
            href="/registrer"
            className="rounded-xl bg-gold px-8 py-4 text-base font-semibold text-navy shadow-lg shadow-gold/20 transition duration-200 hover:-translate-y-0.5 hover:bg-gold/90"
          >
            Kom i gang gratis →
          </Link>
          <a
            href="mailto:hei@verta.no?subject=Kontakt%20Verta"
            className="text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            eller kontakt oss
          </a>
        </div>
      </div>
    </section>
  );
}

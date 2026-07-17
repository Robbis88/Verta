import Link from "next/link";

import { LazyVideo } from "./LazyVideo";

/**
 * Hero — premium, rolig, mobil-først. Ett løfte, én primærknapp.
 * Emosjonell overskrift + Airbnb-kontrasten (0 % på leien) + null friksjon.
 * Entrance-animasjoner er forskjøvet og myke, og slås av ved reduced-motion.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy to-navy-dark">
      {/* Myke gull-glød — store flater, mye pust. */}
      <div className="pointer-events-none absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-gold/10 blur-3xl motion-safe:animate-pulse [animation-duration:7s]" />
      <div className="pointer-events-none absolute -left-40 top-1/2 h-80 w-80 rounded-full bg-gold/[0.06] blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:gap-10 md:py-28 lg:py-32">
        {/* Venstre: budskap */}
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-gold-light animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-both">
            For hytte- og ferieboligeiere
          </span>

          <h1 className="mt-6 text-balance text-[2.6rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.25rem] animate-in fade-in-0 slide-in-from-bottom-3 duration-700 delay-100 fill-mode-both">
            La hytta jobbe for deg.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70 sm:text-xl animate-in fade-in-0 slide-in-from-bottom-3 duration-700 delay-200 fill-mode-both">
            Bookinger og betaling rett til deg — uten Airbnb-kuttet. Gjestene får
            svar av seg selv. Du får roen tilbake.
          </p>

          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row animate-in fade-in-0 slide-in-from-bottom-3 duration-700 delay-300 fill-mode-both">
            <Link
              href="/registrer"
              className="group rounded-xl bg-gold px-7 py-4 text-center text-base font-semibold text-navy shadow-lg shadow-gold/20 transition duration-200 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-xl hover:shadow-gold/25"
            >
              Kom i gang gratis
              <span className="ml-1.5 inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <a
              href="#funksjoner"
              className="rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-center text-base font-semibold text-white backdrop-blur transition duration-200 hover:bg-white/10"
            >
              Se hvordan det funker
            </a>
          </div>

          <p className="mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/45 animate-in fade-in-0 duration-700 delay-500 fill-mode-both">
            <span>14 dager gratis</span>
            <span className="text-gold/50">·</span>
            <span>Ingen binding</span>
            <span className="text-gold/50">·</span>
            <span className="font-medium text-white/60">0 % på leien</span>
            <span className="text-gold/50">·</span>
            <span>Laget i Norge</span>
          </p>
        </div>

        {/* Høyre: ett stort visual i premium-ramme med glød */}
        <div className="relative animate-in fade-in-0 zoom-in-95 duration-1000 delay-300 fill-mode-both md:pl-2">
          <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gold/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl ring-1 ring-white/5">
            <LazyVideo
              src="/videos/hero.mp4"
              className="aspect-video w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

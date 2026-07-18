import { TrendingUp, FileText, Users, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LazyVideo } from "./LazyVideo";

/**
 * Seksjon 7 — «Full kontroll». Produkt-showcase rundt dashboard-videoen
 * (svevende MacBook, widgets animerer). Videoen er stjernen; teksten er rolig
 * og lys. Adresserer penge- og konfliktfrykten før pris.
 */
const pillars: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: TrendingUp,
    title: "Eiendomsøkonomi",
    detail: "Hva hytta koster, tjener og er verdt — måned for måned.",
  },
  {
    icon: FileText,
    title: "Norsk skatt",
    detail: "Grunnlaget til skatterapporten fylles ut automatisk.",
  },
  {
    icon: Users,
    title: "Delt eierskap",
    detail: "Rettferdig oppgjør mellom medeiere, uten krangel.",
  },
  {
    icon: ShieldCheck,
    title: "Skadedekning",
    detail: "Krev dekning fra gjesten når uhellet først er ute.",
  },
];

export function ControlShowcase() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-gold">
            For eiere og forvaltere
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-navy md:text-5xl">
            Full kontroll. Null overraskelser.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/70">
            Alt om hytta samlet på ett sted — inntekt, beleggsgrad, oppgaver og
            økonomi, alltid oppdatert.
          </p>
        </div>

        {/* Dashboard-video — showcase */}
        <div className="relative mx-auto mt-14 max-w-4xl">
          <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gold/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl bg-navy shadow-[0_30px_80px_rgba(8,27,51,0.25)] ring-1 ring-navy/10">
            <LazyVideo
              src="/videos/dashboard.mp4"
              className="aspect-video w-full object-cover"
            />
          </div>
        </div>

        {/* Fire søyler */}
        <div className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="flex flex-col gap-2.5">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-navy text-gold">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="text-base font-semibold text-navy">{p.title}</h3>
                <p className="text-sm leading-relaxed text-ink/70">{p.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex justify-center">
          <a
            href="/registrer"
            className="rounded-xl bg-gold px-7 py-3.5 text-base font-semibold text-navy shadow-lg shadow-gold/20 transition hover:-translate-y-0.5 hover:bg-gold/90"
          >
            Kom i gang gratis
          </a>
        </div>
      </div>
    </section>
  );
}

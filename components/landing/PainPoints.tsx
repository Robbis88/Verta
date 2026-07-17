"use client";

import { useEffect, useRef, useState } from "react";
import {
  Wallet,
  Table2,
  Clock,
  CalendarX2,
  Receipt,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Seksjon 2 — «Fienden / kaoset». Speiler kundens hverdag så de kjenner seg
 * igjen. Smertepunktene toner inn ett og ett når seksjonen scrolles inn
 * (IntersectionObserver), og alt vises statisk ved prefers-reduced-motion.
 */
const pains: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: Wallet,
    title: "Airbnb tar sitt kutt",
    detail: "15–20 % av hver booking — rett ut av lomma di.",
  },
  {
    icon: Table2,
    title: "Alt bor i regneark",
    detail: "Bookinger, priser og utgifter spredt over fem apper.",
  },
  {
    icon: Clock,
    title: "Meldinger klokka 23",
    detail: "«Funker koden?» — enda en gjest som venter på svar.",
  },
  {
    icon: CalendarX2,
    title: "Én dobbeltbooking unna",
    detail: "To kalendere som ikke snakker sammen. Pinlig når det smeller.",
  },
  {
    icon: Receipt,
    title: "Skatten du utsetter",
    detail: "Fribeløp, prosenter, MVA — regler du ikke helt skjønner.",
  },
  {
    icon: Users,
    title: "Hvem betalte hva?",
    detail: "Deler dere hytta, blir økonomien fort en kilde til krangel.",
  },
];

export function PainPoints() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="bg-cloud px-6 py-24 md:py-28">
      <div ref={ref} className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-gold">
            Kjenner du deg igjen?
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-navy md:text-5xl">
            Å leie ut skulle gi frihet.
            <br />
            <span className="text-navy/50">Ikke en ny jobb.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-x-12 gap-y-9 sm:grid-cols-2">
          {pains.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className={`flex items-start gap-4 transition-all duration-700 ease-out motion-reduce:transition-none ${
                  shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
                style={{ transitionDelay: shown ? `${i * 90}ms` : "0ms" }}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-gold shadow-sm ring-1 ring-navy/5">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-lg font-semibold text-navy">{p.title}</h3>
                  <p className="mt-1 leading-relaxed text-ink/70">{p.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`mt-16 flex flex-col items-center gap-1 text-center transition-all duration-700 ease-out motion-reduce:transition-none ${
            shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
          style={{ transitionDelay: shown ? "620ms" : "0ms" }}
        >
          <p className="text-lg font-medium text-navy">
            Det finnes en roligere måte.
          </p>
          <span className="mt-1 animate-bounce text-gold [animation-duration:2s]">
            ↓
          </span>
        </div>
      </div>
    </section>
  );
}

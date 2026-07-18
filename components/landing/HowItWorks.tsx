"use client";

import { useEffect, useRef, useState } from "react";

import { LazyVideo } from "./LazyVideo";

/**
 * Seksjon 5 — «Slik funker det». Dreper frykten for kompleksitet: tre steg,
 * bundet av en tynn linje, avslørt ett og ett ved scroll. flyt.mp4 viser hele
 * flyten. reduced-motion → alt vises statisk.
 */
const steps: { title: string; text: string }[] = [
  {
    title: "Legg inn hytta",
    text: "Bilder, pris og fasiliteter — ferdig på minutter.",
  },
  {
    title: "Del én lenke",
    text: "Gjestene booker, betaler og sjekker inn selv. Også Airbnb-gjester.",
  },
  {
    title: "Len deg tilbake",
    text: "Verta styrer resten. Du får pengene og roen.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
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
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="slik-funker-det" className="bg-cloud px-6 py-24 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-gold">
            Slik funker det
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-navy md:text-5xl">
            Oppe å kjøre samme dag.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/70">
            Ingen konsulent, ingen opplæring. Bare tre steg.
          </p>
        </div>

        <div className="mt-14 grid items-center gap-12 md:grid-cols-2">
          {/* Video — hele flyten */}
          <div className="relative order-1">
            <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gold/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl bg-navy shadow-[0_20px_60px_rgba(8,27,51,0.18)] ring-1 ring-navy/10">
              <LazyVideo
                src="/videos/flyt.mp4"
                className="aspect-video w-full object-cover"
              />
            </div>
          </div>

          {/* Tre steg — bundet av en tynn linje */}
          <ol ref={ref} className="order-2 flex flex-col">
            {steps.map((s, i) => {
              const last = i === steps.length - 1;
              return (
                <li
                  key={s.title}
                  className={`flex gap-4 transition-all duration-700 ease-out motion-reduce:transition-none ${
                    last ? "" : "pb-9"
                  } ${shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                  style={{ transitionDelay: shown ? `${i * 140}ms` : "0ms" }}
                >
                  <div className="flex flex-col items-center">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-lg font-semibold text-gold ring-4 ring-gold/10">
                      {i + 1}
                    </span>
                    {!last && <span className="mt-2 w-px grow bg-gold/30" />}
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-xl font-semibold text-navy">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 leading-relaxed text-ink/70">
                      {s.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
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

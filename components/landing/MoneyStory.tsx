"use client";

import { useEffect, useRef, useState } from "react";

import { LazyVideo } from "./LazyVideo";

/**
 * Seksjon 4 — «Penge-historien» (CRO-gullet). Airbnb tar 15–20 %, Verta 0 % på
 * leien. Besparelsen teller opp når seksjonen scrolles inn. Eksempel: en hytte
 * som tjener 250 000 kr/år. reduced-motion → tallet vises ferdig med en gang.
 */
const YEARLY_INCOME = 250_000;
const AIRBNB_FEE = 37_500; // ~15 %
const VERTA_YEAR = 4_788; // 399 × 12
const SAVING = AIRBNB_FEE - VERTA_YEAR; // 32 712

function kr(n: number): string {
  return `${n.toLocaleString("nb-NO")} kr`;
}

export function MoneyStory() {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        if (reduce) {
          setN(SAVING);
          return;
        }
        const start = performance.now();
        const dur = 1300;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          setN(Math.round(SAVING * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="bg-cloud px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-gold">
            Regnestykket
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-navy md:text-5xl">
            Airbnb tar 15–20 %. Verta tar 0 % av leien.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/70">
            Gjesten betaler deg direkte. Én natt i måneden dekker hele
            abonnementet — resten er ditt.
          </p>
        </div>

        <div className="mt-14 grid items-center gap-10 md:grid-cols-2">
          {/* Tallet + sammenligning */}
          <div ref={ref}>
            <p className="text-sm text-ink/60">
              Eksempel: en hytte som tjener {kr(YEARLY_INCOME)} i året.
            </p>
            <p className="mt-2 text-5xl font-bold tracking-tight text-navy tabular-nums sm:text-6xl">
              <span className="text-gold">+{kr(n)}</span>
            </p>
            <p className="mt-1 text-lg font-medium text-navy">
              mer i lomma — hvert år.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl border border-hairline bg-white px-4 py-3">
                <span className="text-sm text-ink">Med Airbnb (15 % gebyr)</span>
                <span className="font-semibold text-red-600 tabular-nums">
                  −{kr(AIRBNB_FEE)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-white px-4 py-3">
                <span className="text-sm text-ink">
                  Med Verta (0 % på leien, 399 kr/mnd)
                </span>
                <span className="font-semibold text-navy tabular-nums">
                  −{kr(VERTA_YEAR)}
                </span>
              </div>
            </div>

            <a
              href="/registrer"
              className="mt-8 inline-block rounded-xl bg-gold px-7 py-3.5 text-base font-semibold text-navy shadow-lg shadow-gold/20 transition hover:-translate-y-0.5 hover:bg-gold/90"
            >
              Behold pengene dine →
            </a>
            <p className="mt-3 text-xs text-ink/50">
              Eksempeltall. Gjesten betaler kortgebyr, ikke deg.
            </p>
          </div>

          {/* Økonomi-video */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-5 rounded-[2.5rem] bg-gold/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl bg-navy shadow-[0_24px_70px_rgba(8,27,51,0.22)] ring-1 ring-navy/10">
              <LazyVideo
                src="/videos/okonomi.mp4"
                className="aspect-video w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

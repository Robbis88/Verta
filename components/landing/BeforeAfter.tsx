"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";

/**
 * Seksjon 3 — «Vendepunktet». Bindeleddet fra kaos (Seksjon 2) til ro.
 * Visuelt: dagens rot i et dempet, mørkt kort → Verta som et lyst, glødende
 * kort. Scroll-reveal fører øyet fra mørkt (venstre) til lyst (høyre) = utpust.
 */
const scattered = [
  "Airbnb",
  "Booking.com",
  "Excel",
  "SMS",
  "E-post",
  "Papirer",
  "Kalender",
  "Notater",
];

const calm = [
  "Én lenke til gjestene",
  "Betaling rett til deg — uten Airbnb-kuttet",
  "Booking, vask, nøkler og skatt går av seg selv",
];

export function BeforeAfter() {
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
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reveal = `transition-all duration-700 ease-out motion-reduce:transition-none ${
    shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
  }`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-dark to-navy px-6 py-24 md:py-28">
      <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

      <div ref={ref} className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-gold">
            Det finnes en roligere måte
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl">
            Verta gjør hytta til en maskin som passer seg selv.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/60">
            Én lenke til gjestene. Betaling rett til deg. Alt det kjedelige —
            booking, vask, nøkler og skatt — ordnet i bakgrunnen.
          </p>
        </div>

        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* I dag — kaos, dempet og mørkt */}
          <div
            className={`rounded-2xl border border-white/10 bg-white/[0.03] p-7 ${reveal}`}
            style={{ transitionDelay: shown ? "0ms" : "0ms" }}
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-white/40">
              I dag
            </p>
            <div className="flex flex-wrap gap-2.5">
              {scattered.map((s, i) => (
                <span
                  key={s}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50"
                  style={{
                    transform: `rotate(${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg)`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm text-white/40">
              Spredt, stressende, og lett å miste oversikten.
            </p>
          </div>

          {/* Pil — ned på mobil, høyre på desktop */}
          <div className="flex justify-center">
            <div className="flex size-12 rotate-90 items-center justify-center rounded-full bg-gold text-navy shadow-lg md:rotate-0">
              <ArrowRight className="size-6" />
            </div>
          </div>

          {/* Med Verta — ro, lyst og glødende */}
          <div
            className={`relative ${reveal}`}
            style={{ transitionDelay: shown ? "220ms" : "0ms" }}
          >
            <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gold/20 blur-2xl" />
            <div className="relative rounded-2xl bg-white p-7 shadow-[0_20px_60px_rgba(216,166,106,0.25)]">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gold">
                Med Verta
              </p>
              <p className="text-2xl font-bold text-navy">Ro.</p>
              <p className="text-sm text-ink/60">Én plattform · hytta passer seg selv</p>
              <ul className="mt-5 flex flex-col gap-3">
                {calm.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-sm text-navy">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div
          className={`mt-14 flex justify-center ${reveal}`}
          style={{ transitionDelay: shown ? "420ms" : "0ms" }}
        >
          <a
            href="/registrer"
            className="rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            Kom i gang gratis
          </a>
        </div>
      </div>
    </section>
  );
}

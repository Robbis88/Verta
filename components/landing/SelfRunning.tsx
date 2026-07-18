import { LazyVideo } from "./LazyVideo";

/**
 * Seksjon 6 — «Går av seg selv». Produktets sjel: AI-gjesteguide, smartlås og
 * vask som ordner seg selv. Tre vekslende rader med loopende video + rolig tekst.
 * Videoene spiller kun når de er i synsfeltet (LazyVideo).
 */
const rows: { label: string; title: string; text: string; src: string }[] = [
  {
    label: "AI-gjesteguide",
    title: "Svarer gjestene på deres eget språk",
    text: "Fra «hvordan funker varmepumpen?» til «what's the wifi?» — assistenten svarer døgnet rundt, på gjestens eget språk. Du blir aldri vekket klokka 23 igjen.",
    src: "/videos/ai.mp4",
  },
  {
    label: "Smartlås",
    title: "Aldri gi fra deg nøkler",
    text: "Hver gjest får en kode som kun virker under oppholdet — Nuki, Igloohome, Salto eller en enkel nøkkelboks. Innsjekk uten at du må møte opp.",
    src: "/videos/smartlas.mp4",
  },
  {
    label: "Vask og klargjøring",
    title: "Hytta står klar til neste gjest",
    text: "Vaskeoppgaver opprettes automatisk ved utsjekk, og du finner vaskehjelp rett i appen. Ingenting faller mellom to stoler.",
    src: "/videos/vask.mp4",
  },
];

export function SelfRunning() {
  return (
    <section className="bg-white px-6 py-24 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-gold">
            Går av seg selv
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-navy md:text-5xl">
            Gjestene får svar. Uten at du løfter en finger.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/70">
            Guiden svarer, låsen åpner, vasken ordner seg — mens du gjør noe helt
            annet.
          </p>
        </div>

        <div className="mt-16 flex flex-col gap-16 md:gap-20">
          {rows.map((r, i) => (
            <div
              key={r.title}
              className={`flex flex-col items-center gap-8 md:gap-12 ${
                i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
              }`}
            >
              {/* Video */}
              <div className="relative w-full md:w-1/2">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gold/10 blur-2xl" />
                <div className="relative overflow-hidden rounded-2xl bg-navy shadow-[0_20px_60px_rgba(8,27,51,0.18)] ring-1 ring-navy/10">
                  <LazyVideo
                    src={r.src}
                    className="aspect-video w-full object-cover"
                  />
                </div>
              </div>

              {/* Tekst */}
              <div className="w-full md:w-1/2">
                <p className="text-sm font-semibold tracking-wide text-gold">
                  {r.label}
                </p>
                <h3 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-navy md:text-3xl">
                  {r.title}
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-ink/70">
                  {r.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
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

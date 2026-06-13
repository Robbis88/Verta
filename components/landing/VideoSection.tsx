import { LazyVideo } from "./LazyVideo";

export function VideoSection({
  src,
  eyebrow,
  title,
  text,
  bullets,
  tone = "light",
}: {
  src: string;
  eyebrow?: string;
  title: string;
  text: string;
  bullets?: string[];
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <section
      className={`px-6 py-24 ${dark ? "bg-navy" : "bg-white"}`}
    >
      <div className="mx-auto max-w-4xl text-center">
        {eyebrow && (
          <p className={`text-sm font-semibold tracking-wide ${dark ? "text-gold-light" : "text-gold"}`}>
            {eyebrow}
          </p>
        )}
        <h2
          className={`mt-2 text-3xl font-bold tracking-tight md:text-4xl ${
            dark ? "text-white" : "text-navy"
          }`}
        >
          {title}
        </h2>
        <p className={`mx-auto mt-4 max-w-xl text-lg ${dark ? "text-white/70" : "text-ink"}`}>
          {text}
        </p>

        <div
          className={`mt-10 overflow-hidden rounded-2xl border shadow-2xl ${
            dark ? "border-white/10" : "border-hairline"
          }`}
        >
          <LazyVideo src={src} className="aspect-video w-full object-cover" />
        </div>

        {bullets && bullets.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {bullets.map((b) => (
              <span
                key={b}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  dark
                    ? "bg-white/10 text-white/80"
                    : "bg-cloud text-navy"
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

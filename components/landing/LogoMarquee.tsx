const platforms = [
  "Airbnb",
  "Booking.com",
  "Finn.no",
  "Instagram",
  "Facebook",
  "TikTok",
  "Vipps",
  "Nuki",
  "Igloohome",
  "Salto",
];

function Track({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center"
    >
      {platforms.map((p) => (
        <li
          key={p}
          className="whitespace-nowrap px-10 text-2xl font-semibold text-ink/50"
        >
          {p}
        </li>
      ))}
    </ul>
  );
}

export function LogoMarquee() {
  return (
    <section className="border-y bg-white py-10">
      <p className="mb-7 text-center text-sm font-semibold tracking-wide text-gold">
        FUNGERER MED KANALENE DU ALLEREDE BRUKER
      </p>
      <div className="group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          <Track />
          <Track ariaHidden />
        </div>
      </div>
    </section>
  );
}

const painPoints = [
  {
    icon: "💰",
    title: "Airbnb-gebyr dreper marginene",
    description:
      "15 % gebyr på hver booking. En hytte som tjener 40 000 kr per sesong mister 6 000 kr i gebyrer. Direktebooking sparer det hele.",
  },
  {
    icon: "🧾",
    title: "Skatt er et kaos",
    description:
      "DPI-regler er rotete. Fribeløp på 15 000 kr, 85 % skattepliktig overskytende, MVA-regler uklare. Vi gjør det automatisk.",
  },
  {
    icon: "📅",
    title: "Flere kanaler = flere kalendre",
    description:
      "Airbnb, Booking.com, Finn, egen side. Dobbeltbookinger er fienden. Én kalender, alle kanaler synkronisert.",
  },
  {
    icon: "📉",
    title: "Lave bookinger = stresset eier",
    description:
      "Synlighet på Airbnb krymper når konkurransen stiger. Markedsføring er dyrt og komplisert. Vi gjør det enkelt og billig.",
  },
];

export function PainPoints() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16">
          <p className="mb-2 text-sm font-semibold tracking-wide text-gold">
            PROBLEMET
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Hvorfor er det så vanskelig?
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {painPoints.map((p) => (
            <div
              key={p.title}
              className="rounded-lg border border-hairline bg-cloud p-8 transition hover:shadow-lg"
            >
              <div className="mb-4 text-4xl">{p.icon}</div>
              <h3 className="mb-3 text-xl font-semibold text-navy">{p.title}</h3>
              <p className="leading-relaxed text-ink">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    num: 1,
    icon: "🎯",
    title: "Registrer med Vipps",
    desc: "Scan QR-kode, godta. Du er logget inn.",
    time: "2 min",
  },
  {
    num: 2,
    icon: "🏠",
    title: "Legg til hytta",
    desc: "Navn, adresse, type. Vi gjør resten.",
    time: "3 min",
  },
  {
    num: 3,
    icon: "💳",
    title: "Velg plan",
    desc: "Basis, Pluss eller Premium. Oppgrader når du vil.",
    time: "1 min",
  },
  {
    num: 4,
    icon: "🚀",
    title: "Kom i gang",
    desc: "Dashboard, bookinger, markedsføring. Alt klart.",
    time: "Dag 1",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold tracking-wide text-gold">
            HVORDAN
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Fem minutter fra start til live
          </h2>
          <p className="text-lg text-ink">Det er enklere enn du tror</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="mb-2 text-3xl">{step.icon}</div>
              <div className="mb-3 text-5xl font-bold text-gold">{step.num}</div>
              <h3 className="mb-2 text-lg font-semibold text-navy">
                {step.title}
              </h3>
              <p className="mb-4 text-sm text-ink">{step.desc}</p>
              <p className="text-xs font-semibold text-gold">{step.time}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

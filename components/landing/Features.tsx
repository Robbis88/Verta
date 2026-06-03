import { Card } from "@/components/ui/card";

const features = [
  {
    icon: "🔑",
    title: "Direkte bookinger",
    description: "Slipp Airbnb-gebyret. Full kontroll. Dine kunder.",
  },
  {
    icon: "🔒",
    title: "Smartlås-integrasjon",
    description: "Nuki-lås. Automatisk kode. Ingen nøkkelutveksling.",
  },
  {
    icon: "🧾",
    title: "Skatt på autopilot",
    description: "DPI-rapportering. Ferdig utfylt for Skatteetaten.",
  },
  {
    icon: "📅",
    title: "Multi-kanal sync",
    description: "Airbnb, Booking, Finn. Én kalender. Null dobbeltbooking.",
  },
  {
    icon: "✨",
    title: "AI-markedsføring",
    description: "Genererte annonser. Flere bookinger. 10 % provisjon.",
  },
  {
    icon: "📊",
    title: "Premium analytics",
    description: "ROI per boost. Inntekt per kanal. Sanntidssporing.",
  },
];

export function Features() {
  return (
    <section className="bg-cloud px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Alt du trenger
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-8 transition hover:shadow-lg">
              <div className="mb-4 text-4xl">{f.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-navy">{f.title}</h3>
              <p className="text-sm leading-relaxed text-ink">{f.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

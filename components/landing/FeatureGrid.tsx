import {
  CalendarCheck,
  CalendarDays,
  TrendingUp,
  Languages,
  Bike,
  KeyRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const features: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: CalendarCheck,
    title: "Bookingside uten gebyr",
    text: "Egen bookingside med bilder, kart og fasiliteter. Gjesten betaler deg direkte — null plattformgebyr på leien. Ta imot betaling med en gang, eller godkjenn hver gjest med depositum.",
  },
  {
    icon: CalendarDays,
    title: "Kalender og kanaler",
    text: "Én delt kalender med toveis synk mot Airbnb og Booking. Alltid oppdatert tilgjengelighet, uten dobbeltbooking.",
  },
  {
    icon: Languages,
    title: "AI-gjesteguide på alle språk",
    text: "Digital guide med WiFi, innsjekk og lokale tips — og en AI-concierge som svarer gjestene på deres eget språk, døgnet rundt. Fungerer også for Airbnb-gjester.",
  },
  {
    icon: Bike,
    title: "Utleie av utstyr",
    text: "La gjestene leie sykler, ski og kajakk direkte i gjesteguiden. Betalingen skjer automatisk og går rett til deg.",
  },
  {
    icon: TrendingUp,
    title: "Eiendomsøkonomi og skatt",
    text: "Se hva hytta koster og tjener per måned, kvartal og år. Delt eierskap med oppgjør, og ferdig skatterapport til banken.",
  },
  {
    icon: KeyRound,
    title: "Vask, drift og smartlås",
    text: "Vaske-marked, vedlikeholdssaker, lager og smartlås — Nuki, Igloohome og Salto. Hele driften samlet på ett sted.",
  },
];

export function FeatureGrid() {
  return (
    <section id="funksjoner" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Alt du trenger for å drive ferieboliger
          </h2>
          <p className="mt-4 text-lg text-ink">
            Verktøyene en moderne utleiedrift trenger — samlet, ryddig og enkelt.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-hairline bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_12px_40px_rgba(8,27,51,0.10)]"
              >
                <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-navy text-gold transition group-hover:bg-gold group-hover:text-navy">
                  <Icon className="size-6" strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-navy">{f.title}</h3>
                <p className="text-sm leading-relaxed text-ink">{f.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

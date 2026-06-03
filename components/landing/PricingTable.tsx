import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Plan = {
  key: "basis" | "pluss" | "premium";
  name: string;
  price: string;
  highlighted?: boolean;
  features: { label: string; included: boolean }[];
};

const plans: Plan[] = [
  {
    key: "basis",
    name: "Basis",
    price: "149 kr",
    features: [
      { label: "1 eiendom", included: true },
      { label: "Kalender (Airbnb-sync)", included: true },
      { label: "Direkte bookingside", included: true },
      { label: "Skatt-rapport", included: true },
      { label: "AI-annonse", included: true },
      { label: "Multi-kanal", included: false },
      { label: "Boost-annonsering", included: false },
      { label: "Smartlås", included: false },
    ],
  },
  {
    key: "pluss",
    name: "Pluss",
    price: "249 kr",
    highlighted: true,
    features: [
      { label: "1 eiendom", included: true },
      { label: "Kalender (Airbnb-sync)", included: true },
      { label: "Direkte bookingside", included: true },
      { label: "Skatt-rapport", included: true },
      { label: "AI-annonse", included: true },
      { label: "Multi-kanal (Finn)", included: true },
      { label: "Boost-annonsering", included: true },
      { label: "SMS-notifikasjoner", included: true },
      { label: "Analytics", included: true },
      { label: "Smartlås", included: false },
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: "349 kr",
    features: [
      { label: "1 eiendom", included: true },
      { label: "Alt i Pluss", included: true },
      { label: "Smartlås (Nuki)", included: true },
      { label: "Priority support", included: true },
      { label: "Avansert skatterapport", included: true },
      { label: "API-tilgang", included: true },
      { label: "+99 kr/mnd per ekstra eiendom", included: true },
    ],
  },
];

export function PricingTable() {
  return (
    <section id="priser" className="bg-cloud px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold tracking-wide text-gold">
            PRISER
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Enkel prising for alle
          </h2>
          <p className="text-lg text-ink">
            Velg riktig plan for deg. Oppgrader når du er klar.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={cn(
                "relative rounded-xl border-2 bg-white p-8",
                plan.highlighted
                  ? "border-gold shadow-[0_10px_30px_rgba(216,166,106,0.15)] md:scale-105"
                  : "border-hairline",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-4 right-8 rounded-full bg-gold px-4 py-1 text-sm font-semibold text-navy">
                  Mest populær
                </span>
              )}
              <h3 className="mb-2 text-2xl font-bold text-navy">{plan.name}</h3>
              <p className="text-5xl font-bold text-gold">{plan.price}</p>
              <p className="mb-8 text-ink">/mnd</p>

              <Button
                asChild
                className={cn(
                  "mb-8 h-auto w-full rounded-lg py-3 text-base font-semibold",
                  plan.highlighted
                    ? "bg-gold text-navy hover:bg-gold/90"
                    : "border-2 border-navy bg-white text-navy hover:bg-navy hover:text-white",
                )}
              >
                <Link href={`/login?plan=${plan.key}`}>Velg {plan.name}</Link>
              </Button>

              <ul className="space-y-4">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm">
                    <span
                      className={f.included ? "text-emerald-500" : "text-ink/40"}
                    >
                      {f.included ? "✓" : "✗"}
                    </span>
                    <span
                      className={f.included ? "text-ink" : "text-ink/40 line-through"}
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

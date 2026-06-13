import { TrendingUp, PieChart, Banknote, Receipt, History } from "lucide-react";

const reports = [
  { icon: PieChart, label: "Beleggsgrad" },
  { icon: TrendingUp, label: "Inntekter" },
  { icon: Banknote, label: "Utbetalinger" },
  { icon: Receipt, label: "Kostnader" },
  { icon: History, label: "Historikk" },
];

const bars = [52, 64, 58, 76, 71, 88, 92, 80, 86, 95, 84, 90];
const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export function Insights() {
  return (
    <section id="innsikt" className="bg-white px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Få innsikt i driften
          </h2>
          <p className="mt-4 text-lg text-ink">
            Tydelige rapporter gir deg kontroll på pengene og beleggsgraden — og
            grunnlaget til skatten er alltid klart.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {reports.map((r) => {
              const Icon = r.icon;
              return (
                <li key={r.label} className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-gold/15 text-gold">
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  <span className="font-medium text-navy">{r.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Rapport-mockup */}
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-[0_12px_40px_rgba(8,27,51,0.08)]">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Inntekt i år" value="612 400 kr" />
            <Stat label="Beleggsgrad" value="78 %" />
            <Stat label="Utbetalt" value="524 100 kr" />
            <Stat label="Kostnader" value="88 300 kr" />
          </div>

          <div className="mt-5 rounded-xl border border-hairline p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-navy">Inntekt per måned</span>
              <span className="text-xs text-emerald-600">+18 % mot i fjor</span>
            </div>
            <div className="flex h-28 items-end gap-1.5">
              {bars.map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-navy/70 to-navy"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[9px] text-ink/40">{months[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-hairline p-4">
      <p className="text-xs text-ink/60">{label}</p>
      <p className="mt-1 text-lg font-bold text-navy">{value}</p>
    </div>
  );
}

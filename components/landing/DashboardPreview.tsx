/** Stilisert dashboard-forhåndsvisning (ren CSS, ingen ekte data) til hero. */
export function DashboardPreview() {
  const bars = [40, 55, 48, 70, 62, 85, 78, 90, 72, 88, 95, 82];
  const bookings = [
    { name: "Familien Berg", place: "Hytte Hemsedal", dates: "14.–18. jun", tag: "Airbnb" },
    { name: "Olsen", place: "Leilighet Tromsø", dates: "16.–20. jun", tag: "Direkte" },
    { name: "Lund", place: "Hytte Hemsedal", dates: "21.–25. jun", tag: "Booking" },
  ];

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
        {/* Vindu-topp */}
        <div className="flex items-center gap-2 border-b border-hairline bg-cloud px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs font-semibold text-navy">Verta · Oversikt</span>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {/* KPI-er */}
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="Inntekt mnd" value="84 200 kr" trend="+12 %" />
            <Kpi label="Beleggsgrad" value="78 %" trend="+5 %" />
            <Kpi label="Kommende" value="12" trend="bookinger" muted />
          </div>

          {/* Inntektsgraf */}
          <div className="rounded-xl border border-hairline p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-navy">Inntekt siste 12 mnd</span>
              <span className="text-xs text-ink/60">2026</span>
            </div>
            <div className="flex h-24 items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-gold/40 to-gold"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Kommende bookinger */}
            <div className="rounded-xl border border-hairline p-4">
              <span className="text-xs font-semibold text-navy">Kommende bookinger</span>
              <ul className="mt-3 flex flex-col gap-2.5">
                {bookings.map((b) => (
                  <li key={b.name} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-navy">{b.name}</p>
                      <p className="truncate text-[11px] text-ink/60">{b.place}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-ink/70">{b.dates}</p>
                      <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] text-navy">
                        {b.tag}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Oppgaver */}
            <div className="rounded-xl border border-hairline p-4">
              <span className="text-xs font-semibold text-navy">Oppgaver</span>
              <ul className="mt-3 flex flex-col gap-2.5 text-xs">
                <Task done text="Vask før innsjekk – Hemsedal" />
                <Task text="Send adgangskode – Olsen" />
                <Task text="Fyll opp forbruksvarer" />
                <Task done text="Bekreft booking – Lund" />
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Flytende «inntekt»-brikke for dybde */}
      <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-hairline bg-white p-3 shadow-xl sm:block">
        <p className="text-[11px] text-ink/60">Utbetalt i år</p>
        <p className="text-lg font-bold text-navy">612 400 kr</p>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  trend,
  muted,
}: {
  label: string;
  value: string;
  trend: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-hairline p-3">
      <p className="text-[11px] text-ink/60">{label}</p>
      <p className="mt-1 text-base font-bold text-navy">{value}</p>
      <p className={`text-[11px] ${muted ? "text-ink/50" : "text-emerald-600"}`}>{trend}</p>
    </div>
  );
}

function Task({ text, done }: { text: string; done?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border ${
          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-ink/30"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <span className={done ? "text-ink/40 line-through" : "text-ink"}>{text}</span>
    </li>
  );
}

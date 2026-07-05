import { getEconomyContext, getTimeline } from "@/lib/okonomi";
import { formatNok } from "@/lib/utils";
import { MoneyRow, EmptyOkonomi } from "@/components/okonomi/ui";
import { DemoAction } from "@/components/okonomi/demo-action";
import { Card, CardContent } from "@/components/ui/card";

export default async function BankrapportPage({
  searchParams,
}: {
  searchParams: Promise<{ eiendom?: string }>;
}) {
  const { eiendom } = await searchParams;
  const { selected, economy } = await getEconomyContext(eiendom);
  if (!selected || !economy) return <EmptyOkonomi />;

  const equity = economy.value - economy.loan;
  const ltv = Math.round((economy.loan / economy.value) * 100);
  const last = economy.history[economy.history.length - 1];
  const annualInterest = Math.round(economy.loan * (economy.interestRatePct / 100));
  const taxEstimate = Math.round(Math.max(0, last.result) * (economy.taxRatePct / 100));
  const cashflowAfterTax = last.result - taxEstimate;
  const yieldPct = ((last.result / economy.value) * 100).toFixed(1);
  const interestCover =
    annualInterest > 0 ? (last.income / annualInterest).toFixed(1) : "–";

  const timeline = await getTimeline(selected.id);
  const maintenance = (timeline.length ? timeline : economy.timeline).filter(
    (e) => e.kind === "oppussing" || e.kind === "vedlikehold",
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Bankrapport</h2>
          <p className="text-sm text-muted-foreground">{economy.propertyName}</p>
        </div>
        <DemoAction
          label="Last ned PDF"
          done="PDF-eksport kommer snart — rapporten er klar til å deles med banken."
        />
      </div>

      {/* Rapport-forhåndsvisning, stilt som et dokument. */}
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="border-b border-hairline pb-4 text-center">
            <p className="text-lg font-bold tracking-tight text-navy">Verta</p>
            <p className="text-sm text-muted-foreground">
              Eiendomsrapport · {economy.propertyName}
            </p>
          </div>

          <section>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gold">
              Balanse
            </h3>
            <MoneyRow label="Eiendomsverdi" value={formatNok(economy.value)} />
            <MoneyRow label="Lån" value={formatNok(economy.loan)} />
            <MoneyRow label="Egenkapital" value={formatNok(equity)} strong />
            <MoneyRow label="Belåningsgrad" value={`${ltv} %`} muted />
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gold">
              Drift (siste år)
            </h3>
            <MoneyRow label="Leieinntekter" value={formatNok(last.income)} />
            <MoneyRow label="Kostnader" value={formatNok(last.costs)} />
            <MoneyRow label="Resultat før skatt" value={formatNok(last.result)} strong />
            <MoneyRow label="Estimert skatt" value={formatNok(taxEstimate)} muted />
            <MoneyRow label="Kontantstrøm etter skatt" value={formatNok(cashflowAfterTax)} strong />
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gold">
              Nøkkeltall
            </h3>
            <MoneyRow label="Direkteavkastning" value={`${yieldPct} %`} muted />
            <MoneyRow label="Rentedekningsgrad" value={`${interestCover}×`} muted />
            <MoneyRow label="Rente" value={`${economy.interestRatePct} %`} muted />
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold">
              Verdiutvikling
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {economy.history.map((h) => (
                <span key={h.year} className="tabular-nums">
                  <span className="text-muted-foreground">{h.year}:</span>{" "}
                  {formatNok(h.value)}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold">
              Vedlikeholdshistorikk
            </h3>
            <ul className="flex flex-col gap-1 text-sm">
              {maintenance.map((m, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    {m.year} · {m.title}
                  </span>
                  {m.amount != null && (
                    <span className="tabular-nums text-muted-foreground">
                      {formatNok(m.amount)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <p className="border-t border-hairline pt-3 text-center text-xs text-muted-foreground">
            Generert av Verta · Tallene er foreløpig estimater
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

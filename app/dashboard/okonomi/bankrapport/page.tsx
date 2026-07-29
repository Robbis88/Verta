import { getEconomyContext, getTimeline } from "@/lib/okonomi";
import { formatNok } from "@/lib/utils";
import { MoneyRow, EmptyOkonomi } from "@/components/okonomi/ui";
import { DemoAction } from "@/components/okonomi/demo-action";
import { Flate, Liste } from "@/components/hus";

/**
 * Bankrapport — modul 6. Kun presentasjon; samme beregninger.
 *
 * Rapporten er stilt som et dokument og arver husets utskriftsstil, så den kan
 * skrives ut på hvitt papir og leveres i banken.
 */
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
    <>
      <div className="hus-ikke-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-hus-dempet">
          Alt banken pleier å spørre om, samlet på ett ark.
        </p>
        <DemoAction
          label="Last ned PDF"
          done="PDF-eksport kommer snart — rapporten er klar til å deles med banken."
        />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <Flate>
          <div className="border-b border-hus-linje pb-4 text-center">
            <p className="text-lg font-semibold tracking-tight text-hus-gull">
              Verta
            </p>
            <p className="mt-1 text-sm text-hus-svak">
              Eiendomsrapport · {economy.propertyName}
            </p>
          </div>

          <Bolk tittel="Balanse">
            <MoneyRow label="Eiendomsverdi" value={formatNok(economy.value)} />
            <MoneyRow label="Lån" value={formatNok(economy.loan)} />
            <MoneyRow label="Egenkapital" value={formatNok(equity)} strong />
            <MoneyRow label="Belåningsgrad" value={`${ltv} %`} muted />
          </Bolk>

          <Bolk tittel="Drift (siste år)">
            <MoneyRow label="Leieinntekter" value={formatNok(last.income)} />
            <MoneyRow label="Kostnader" value={formatNok(last.costs)} />
            <MoneyRow
              label="Resultat før skatt"
              value={formatNok(last.result)}
              strong
            />
            <MoneyRow label="Estimert skatt" value={formatNok(taxEstimate)} muted />
            <MoneyRow
              label="Kontantstrøm etter skatt"
              value={formatNok(cashflowAfterTax)}
              strong
            />
          </Bolk>

          <Bolk tittel="Nøkkeltall">
            <MoneyRow label="Direkteavkastning" value={`${yieldPct} %`} muted />
            <MoneyRow label="Rentedekningsgrad" value={`${interestCover}×`} muted />
            <MoneyRow label="Rente" value={`${economy.interestRatePct} %`} muted />
          </Bolk>

          <Bolk tittel="Verdiutvikling">
            <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm">
              {economy.history.map((h) => (
                <span key={h.year} className="tabular-nums text-hus-blekk">
                  <span className="text-hus-svak">{h.year}:</span>{" "}
                  {formatNok(h.value)}
                </span>
              ))}
            </div>
          </Bolk>

          <Bolk tittel="Vedlikeholdshistorikk">
            <Liste>
              {maintenance.map((m, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-4 border-b border-hus-linje-svak py-2.5 text-sm last:border-b-0"
                >
                  <span className="text-hus-blekk">
                    {m.year} · {m.title}
                  </span>
                  {m.amount != null && (
                    <span className="shrink-0 tabular-nums text-hus-dempet">
                      {formatNok(m.amount)}
                    </span>
                  )}
                </li>
              ))}
            </Liste>
          </Bolk>

          <p className="mt-6 border-t border-hus-linje pt-4 text-center text-xs text-hus-svak">
            Generert av Verta · Tallene er foreløpig estimater
          </p>
        </Flate>
      </div>
    </>
  );
}

/** En seksjon i rapporten. Lokal, fordi den kun finnes her. */
function Bolk({
  tittel,
  children,
}: {
  tittel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-hus-gull">
        {tittel}
      </h3>
      {children}
    </section>
  );
}

import { getEconomyContext } from "@/lib/okonomi";
import { monthlyCostTotal, monthlyIncomeTotal } from "@/lib/okonomi-mock";
import { formatNok } from "@/lib/utils";
import { StatCard, EmptyOkonomi } from "@/components/okonomi/ui";
import { AiBox } from "@/components/okonomi/ai-box";
import { Beskjed, Felt, Flate, Handling } from "@/components/hus";
import { updateEconomy } from "./actions";

const MONTHS_SO_FAR = 7; // mock: antall måneder hittil i år

/**
 * Eiendomsøkonomi, oversikt — modul 6. Kun presentasjon; samme beregninger og
 * samme `updateEconomy` med samme fire felter.
 */
export default async function OkonomiOversikt({
  searchParams,
}: {
  searchParams: Promise<{ eiendom?: string; lagret?: string }>;
}) {
  const { eiendom, lagret } = await searchParams;
  const { selected, selectedFinance, economy } =
    await getEconomyContext(eiendom);
  if (!selected || !economy) return <EmptyOkonomi />;

  const equity = economy.value - economy.loan;
  const ltv = Math.round((economy.loan / economy.value) * 100);
  const income = monthlyIncomeTotal(economy);
  const costs = monthlyCostTotal(economy);
  const resultMonth = income - costs;
  const ytdIncome = economy.income.sources.reduce((s, x) => s + x.ytd, 0);
  const ytdResult = ytdIncome - costs * MONTHS_SO_FAR;
  const taxEstimate = Math.round(
    Math.max(0, ytdResult) * (economy.taxRatePct / 100),
  );
  const cashflowAfterTax =
    resultMonth > 0
      ? Math.round(resultMonth * (1 - economy.taxRatePct / 100))
      : resultMonth;

  const qs = `?eiendom=${selected.id}`;

  return (
    <>
      <p className="text-sm text-hus-dempet">
        {economy.propertyName} er verdt{" "}
        <span className="text-hus-gull-lys">{formatNok(economy.value)}</span>, og{" "}
        {resultMonth >= 0 ? (
          <>
            gir deg{" "}
            <span className="text-hus-god">{formatNok(resultMonth)}</span> i
            måneden før skatt.
          </>
        ) : (
          <>
            koster deg{" "}
            <span className="text-hus-kritisk">
              {formatNok(Math.abs(resultMonth))}
            </span>{" "}
            i måneden.
          </>
        )}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Antatt verdi"
          value={formatNok(economy.value)}
          sub={economy.propertyName}
          tone="gold"
        />
        <StatCard label="Lån" value={formatNok(economy.loan)} />
        <StatCard
          label="Egenkapital"
          value={formatNok(equity)}
          tone="positive"
        />
        <StatCard label="Belåningsgrad" value={`${ltv} %`} sub="Lån av verdi" />
        <StatCard label="Inntekter / mnd" value={formatNok(income)} />
        <StatCard label="Kostnader / mnd" value={formatNok(costs)} />
        <StatCard
          label="Resultat denne mnd"
          value={formatNok(resultMonth)}
          tone={resultMonth >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Resultat hittil i år"
          value={formatNok(ytdResult)}
          tone={ytdResult >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Estimert skatt"
          value={formatNok(taxEstimate)}
          sub={`${economy.taxRatePct} % sats`}
        />
        <StatCard
          label="Kontantstrøm etter skatt"
          value={formatNok(cashflowAfterTax)}
          sub="per måned"
          tone="gold"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Handling href={`/dashboard/okonomi/bankrapport${qs}`} vekt="gull">
          Lag bankrapport
        </Handling>
        <Handling href={`/dashboard/okonomi/kostnader${qs}`} vekt="stille">
          Se kostnadene
        </Handling>
      </div>

      <Flate
        tittel="Verdi, lån og rente"
        hva={`Disse tallene ligger til grunn for egenkapital, belåningsgrad og kontantstrøm over. Gjelder ${selected.name}.`}
      >
        {lagret && <Beskjed>Lagret.</Beskjed>}
        <form action={updateEconomy} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="property_id" value={selected.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Felt
              navn="market_value"
              merke="Antatt verdi (kr)"
              type="number"
              min={0}
              step="1000"
              defaultValue={selectedFinance?.market_value ?? ""}
            />
            <Felt
              navn="loan_amount"
              merke="Lån (kr)"
              type="number"
              min={0}
              step="1000"
              defaultValue={selectedFinance?.loan_amount ?? ""}
            />
            <Felt
              navn="interest_rate"
              merke="Rente (%)"
              type="number"
              min={0}
              step="0.01"
              defaultValue={selectedFinance?.interest_rate ?? ""}
            />
            <Felt
              navn="monthly_principal"
              merke="Avdrag per måned (kr)"
              type="number"
              min={0}
              step="100"
              defaultValue={selectedFinance?.monthly_principal ?? ""}
            />
          </div>
          <div>
            <Handling type="submit" vekt="gull">
              Lagre
            </Handling>
          </div>
        </form>
      </Flate>

      <AiBox />
    </>
  );
}

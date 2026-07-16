import Link from "next/link";

import { getEconomyContext } from "@/lib/okonomi";
import { monthlyCostTotal, monthlyIncomeTotal } from "@/lib/okonomi-mock";
import { formatNok } from "@/lib/utils";
import { StatCard, EmptyOkonomi } from "@/components/okonomi/ui";
import { AiBox } from "@/components/okonomi/ai-box";
import { Button } from "@/components/ui/button";
import { updateEconomy } from "./actions";

const MONTHS_SO_FAR = 7; // mock: antall måneder hittil i år

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
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Antatt verdi" value={formatNok(economy.value)} sub={economy.propertyName} tone="gold" />
        <StatCard label="Lån" value={formatNok(economy.loan)} />
        <StatCard label="Egenkapital" value={formatNok(equity)} tone="positive" />
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
        <StatCard label="Estimert skatt" value={formatNok(taxEstimate)} sub={`${economy.taxRatePct} % sats`} />
        <StatCard
          label="Kontantstrøm etter skatt"
          value={formatNok(cashflowAfterTax)}
          sub="per måned"
          tone="gold"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/dashboard/okonomi/bankrapport${qs}`}>Lag bankrapport</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/dashboard/okonomi/kostnader${qs}`}>Se kostnadene</Link>
        </Button>
      </div>

      <details className="rounded-xl border border-hairline bg-white p-5">
        <summary className="cursor-pointer text-sm font-semibold text-navy">
          Rediger verdi, lån og rente
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          Disse tallene brukes til egenkapital, belåningsgrad, renter og
          kontantstrøm over. Gjelder <strong>{selected.name}</strong>.
        </p>
        {lagret && (
          <p className="mt-2 text-sm text-emerald-600">Lagret. ✅</p>
        )}
        <form
          action={updateEconomy}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <input type="hidden" name="property_id" value={selected.id} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Antatt verdi (kr)</span>
            <input
              name="market_value"
              type="number"
              min={0}
              step="1000"
              defaultValue={selectedFinance?.market_value ?? ""}
              className="h-10 rounded-lg border border-hairline bg-white px-3 shadow-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Lån (kr)</span>
            <input
              name="loan_amount"
              type="number"
              min={0}
              step="1000"
              defaultValue={selectedFinance?.loan_amount ?? ""}
              className="h-10 rounded-lg border border-hairline bg-white px-3 shadow-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Rente (%)</span>
            <input
              name="interest_rate"
              type="number"
              min={0}
              step="0.01"
              defaultValue={selectedFinance?.interest_rate ?? ""}
              className="h-10 rounded-lg border border-hairline bg-white px-3 shadow-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Avdrag per måned (kr)</span>
            <input
              name="monthly_principal"
              type="number"
              min={0}
              step="100"
              defaultValue={selectedFinance?.monthly_principal ?? ""}
              className="h-10 rounded-lg border border-hairline bg-white px-3 shadow-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm">
              Lagre
            </Button>
          </div>
        </form>
      </details>

      <AiBox />
    </div>
  );
}

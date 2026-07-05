import Link from "next/link";

import { getEconomyContext } from "@/lib/okonomi";
import { monthlyCostTotal, monthlyIncomeTotal } from "@/lib/okonomi-mock";
import { formatNok } from "@/lib/utils";
import { StatCard, EmptyOkonomi } from "@/components/okonomi/ui";
import { AiBox } from "@/components/okonomi/ai-box";
import { Button } from "@/components/ui/button";

const MONTHS_SO_FAR = 7; // mock: antall måneder hittil i år

export default async function OkonomiOversikt({
  searchParams,
}: {
  searchParams: Promise<{ eiendom?: string }>;
}) {
  const { eiendom } = await searchParams;
  const { selected, economy } = await getEconomyContext(eiendom);
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

      <AiBox />
    </div>
  );
}

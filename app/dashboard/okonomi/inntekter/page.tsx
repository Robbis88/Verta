import { getEconomyContext } from "@/lib/okonomi";
import { formatNok } from "@/lib/utils";
import { StatCard, EmptyOkonomi } from "@/components/okonomi/ui";
import { Flate, Tabell } from "@/components/hus";

/**
 * Inntekter — modul 6. Kun presentasjon; samme beregninger.
 */
export default async function InntekterPage({
  searchParams,
}: {
  searchParams: Promise<{ eiendom?: string }>;
}) {
  const { eiendom } = await searchParams;
  const { selected, economy } = await getEconomyContext(eiendom);
  if (!selected || !economy) return <EmptyOkonomi />;

  const { sources } = economy.income;
  const ytdTotal = sources.reduce((s, x) => s + x.ytd, 0);
  const lastYearTotal = sources.reduce((s, x) => s + x.lastYear, 0);
  const diffPct =
    lastYearTotal > 0
      ? Math.round(((ytdTotal - lastYearTotal) / lastYearTotal) * 100)
      : 0;

  return (
    <>
      <p className="text-sm text-hus-dempet">
        {economy.propertyName} har tjent{" "}
        <span className="text-hus-gull-lys">{formatNok(ytdTotal)}</span> hittil i
        år — {diffPct >= 0 ? "opp" : "ned"} {Math.abs(diffPct)} % mot i fjor.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Hittil i år" value={formatNok(ytdTotal)} tone="gold" />
        <StatCard
          label="Mot i fjor"
          value={`${diffPct >= 0 ? "+" : ""}${diffPct} %`}
          tone={diffPct >= 0 ? "positive" : "negative"}
          sub={`${formatNok(lastYearTotal)} i fjor`}
        />
        <StatCard
          label="Beleggsprosent"
          value={`${economy.income.occupancyPct} %`}
        />
        <StatCard
          label="Snitt døgnpris"
          value={formatNok(economy.income.avgNightly)}
        />
        <StatCard
          label="Beste måned"
          value={economy.income.bestMonth}
          tone="positive"
        />
        <StatCard label="Svakeste måned" value={economy.income.worstMonth} />
      </div>

      <Flate tittel="Inntekt per kilde">
        <Tabell
          kolonner={["Kilde", "Denne mnd", "Hittil i år", "I fjor"]}
          sisteSterk
          rader={[
            ...sources.map((s) => [
              s.label,
              formatNok(s.thisMonth),
              formatNok(s.ytd),
              formatNok(s.lastYear),
            ]),
            [
              "Totalt",
              formatNok(sources.reduce((s, x) => s + x.thisMonth, 0)),
              formatNok(ytdTotal),
              formatNok(lastYearTotal),
            ],
          ]}
        />
      </Flate>
    </>
  );
}

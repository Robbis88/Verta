import { getEconomyContext } from "@/lib/okonomi";
import { formatNok } from "@/lib/utils";
import { StatCard, EmptyOkonomi } from "@/components/okonomi/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Inntekter</h2>
        <p className="text-sm text-muted-foreground">{economy.propertyName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hittil i år" value={formatNok(ytdTotal)} tone="gold" />
        <StatCard
          label="Mot i fjor"
          value={`${diffPct >= 0 ? "+" : ""}${diffPct} %`}
          tone={diffPct >= 0 ? "positive" : "negative"}
          sub={formatNok(lastYearTotal) + " i fjor"}
        />
        <StatCard label="Beleggsprosent" value={`${economy.income.occupancyPct} %`} />
        <StatCard label="Snitt døgnpris" value={formatNok(economy.income.avgNightly)} />
        <StatCard label="Beste måned" value={economy.income.bestMonth} tone="positive" />
        <StatCard label="Svakeste måned" value={economy.income.worstMonth} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inntekt per kilde</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 text-left font-medium">Kilde</th>
                  <th className="py-2 text-right font-medium">Denne mnd</th>
                  <th className="py-2 text-right font-medium">Hittil i år</th>
                  <th className="py-2 text-right font-medium">I fjor</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.key} className="border-b border-hairline/60">
                    <td className="py-2">{s.label}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNok(s.thisMonth)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNok(s.ytd)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {formatNok(s.lastYear)}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold text-navy">
                  <td className="py-3">Totalt</td>
                  <td className="py-3 text-right tabular-nums">
                    {formatNok(sources.reduce((s, x) => s + x.thisMonth, 0))}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {formatNok(ytdTotal)}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {formatNok(lastYearTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

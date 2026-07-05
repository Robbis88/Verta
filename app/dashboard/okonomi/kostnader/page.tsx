import { getEconomyContext } from "@/lib/okonomi";
import { monthlyCostTotal } from "@/lib/okonomi-mock";
import { formatNok } from "@/lib/utils";
import { StatCard, EmptyOkonomi } from "@/components/okonomi/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function KostnaderPage({
  searchParams,
}: {
  searchParams: Promise<{ eiendom?: string }>;
}) {
  const { eiendom } = await searchParams;
  const { selected, economy } = await getEconomyContext(eiendom);
  if (!selected || !economy) return <EmptyOkonomi />;

  const total = monthlyCostTotal(economy);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Hva koster hytten?</h2>
        <p className="text-sm text-muted-foreground">{economy.propertyName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Per måned" value={formatNok(total)} />
        <StatCard label="Per kvartal" value={formatNok(total * 3)} />
        <StatCard label="Per år" value={formatNok(total * 12)} tone="gold" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kostnader fordelt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 text-left font-medium">Kostnad</th>
                  <th className="py-2 text-right font-medium">Måned</th>
                  <th className="py-2 text-right font-medium">Kvartal</th>
                  <th className="py-2 text-right font-medium">År</th>
                </tr>
              </thead>
              <tbody>
                {economy.costs.map((c) => (
                  <tr key={c.key} className="border-b border-hairline/60">
                    <td className="py-2">{c.label}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNok(c.monthly)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {formatNok(c.monthly * 3)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {formatNok(c.monthly * 12)}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold text-navy">
                  <td className="py-3">Totalt</td>
                  <td className="py-3 text-right tabular-nums">
                    {formatNok(total)}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {formatNok(total * 3)}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {formatNok(total * 12)}
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

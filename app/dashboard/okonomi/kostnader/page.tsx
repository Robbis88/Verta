import { getEconomyContext } from "@/lib/okonomi";
import { monthlyCostTotal } from "@/lib/okonomi-mock";
import { formatNok } from "@/lib/utils";
import { StatCard, EmptyOkonomi } from "@/components/okonomi/ui";
import { Flate, Tabell } from "@/components/hus";

/**
 * Hva koster hytten — modul 6. Kun presentasjon; samme beregninger.
 */
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
    <>
      <p className="text-sm text-hus-dempet">
        {economy.propertyName} koster deg{" "}
        <span className="text-hus-gull-lys">{formatNok(total)}</span> i måneden,
        enten den er utleid eller ikke.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Per måned" value={formatNok(total)} />
        <StatCard label="Per kvartal" value={formatNok(total * 3)} />
        <StatCard label="Per år" value={formatNok(total * 12)} tone="gold" />
      </div>

      <Flate tittel="Kostnader fordelt">
        <Tabell
          kolonner={["Kostnad", "Måned", "Kvartal", "År"]}
          sisteSterk
          rader={[
            ...economy.costs.map((c) => [
              c.label,
              formatNok(c.monthly),
              formatNok(c.monthly * 3),
              formatNok(c.monthly * 12),
            ]),
            [
              "Totalt",
              formatNok(total),
              formatNok(total * 3),
              formatNok(total * 12),
            ],
          ]}
        />
      </Flate>
    </>
  );
}

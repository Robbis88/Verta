import { getEconomyContext } from "@/lib/okonomi";
import { formatNok } from "@/lib/utils";
import { EmptyOkonomi } from "@/components/okonomi/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const KIND_LABEL: Record<string, string> = {
  kjop: "Kjøp",
  oppussing: "Oppussing",
  vedlikehold: "Vedlikehold",
  finans: "Finans",
  verdi: "Verdivurdering",
};

const KIND_TONE: Record<string, string> = {
  kjop: "bg-navy text-white",
  oppussing: "bg-gold/20 text-navy",
  vedlikehold: "bg-emerald-100 text-emerald-800",
  finans: "bg-blue-100 text-blue-800",
  verdi: "bg-amber-100 text-amber-800",
};

export default async function HistorikkPage({
  searchParams,
}: {
  searchParams: Promise<{ eiendom?: string }>;
}) {
  const { eiendom } = await searchParams;
  const { selected, economy } = await getEconomyContext(eiendom);
  if (!selected || !economy) return <EmptyOkonomi />;

  const events = [...economy.timeline].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Historikk</h2>
        <p className="text-sm text-muted-foreground">{economy.propertyName}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utvikling år for år</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 text-left font-medium">År</th>
                  <th className="py-2 text-right font-medium">Inntekt</th>
                  <th className="py-2 text-right font-medium">Kostnad</th>
                  <th className="py-2 text-right font-medium">Resultat</th>
                  <th className="py-2 text-right font-medium">Verdi</th>
                </tr>
              </thead>
              <tbody>
                {economy.history.map((h) => (
                  <tr key={h.year} className="border-b border-hairline/60">
                    <td className="py-2 font-medium">{h.year}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNok(h.income)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {formatNok(h.costs)}
                    </td>
                    <td
                      className={`py-2 text-right tabular-nums ${h.result >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {formatNok(h.result)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNok(h.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tidslinje</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-4">
            {events.map((e, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex w-12 shrink-0 flex-col items-center">
                  <span className="text-sm font-semibold text-navy">
                    {e.year}
                  </span>
                  <span className="mt-1 h-full w-px bg-hairline" />
                </div>
                <div className="flex flex-1 flex-col gap-1 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-navy">{e.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${KIND_TONE[e.kind] ?? "bg-muted"}`}
                    >
                      {KIND_LABEL[e.kind] ?? e.kind}
                    </span>
                  </div>
                  {e.amount != null && (
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {formatNok(e.amount)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

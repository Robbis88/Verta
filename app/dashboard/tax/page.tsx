import Link from "next/link";
import { TrendingUp, Landmark } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { generateTaxReport } from "./actions";
import { PrintButton } from "@/components/tax/print-button";
import { formatNok } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/overview-ui";
import { Button } from "@/components/ui/button";
import type { TaxReport } from "@/lib/tax";

export default async function TaxPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const year = Number(yearParam) || currentYear;
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const supabase = await createClient();
  const { data } = await supabase
    .from("tax_reports")
    .select("*")
    .eq("year", year)
    .single();
  const report = data as TaxReport | null;

  const rows: { label: string; value: number }[] = report
    ? [
        { label: "Inntekt fra Airbnb", value: report.income_from_airbnb },
        { label: "Inntekt fra Booking.com", value: report.income_from_booking },
        { label: "Inntekt fra direkte booking", value: report.income_from_verta_direct },
        { label: "Inntekt fra Verta-kanaler", value: report.income_from_verta_boosts },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          Skatterapport
        </h1>
        <div className="flex gap-2">
          {years.map((y) => (
            <Button
              key={y}
              asChild
              variant={y === year ? "default" : "outline"}
              size="sm"
            >
              <Link href={`/dashboard/tax?year=${y}`}>{y}</Link>
            </Button>
          ))}
        </div>
      </div>

      {!report ? (
        <div className="flex flex-col items-start gap-3 print:hidden">
          <p className="text-sm text-muted-foreground">
            Ingen rapport for {year} ennå.
          </p>
          <form action={generateTaxReport}>
            <input type="hidden" name="year" value={year} />
            <Button type="submit">Generer rapport for {year}</Button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 print:hidden">
            <KpiCard
              label="Sum inntekt"
              value={formatNok(report.total_income)}
              icon={TrendingUp}
              trend={`utleie ${report.year}`}
              trendTone="muted"
            />
            <KpiCard
              label="Skattepliktig inntekt"
              value={formatNok(report.taxable_income)}
              icon={Landmark}
              trend="grunnlag for skatt"
              trendTone="muted"
            />
          </div>

          <div className="rounded-2xl border border-hairline p-6 shadow-[0_8px_30px_rgba(8,27,51,0.06)] print:border-0 print:shadow-none">
            <h2 className="mb-1 text-xl font-bold text-navy">
              Skatterapport {report.year}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Utleieinntekter og beregnet skattepliktig beløp.
            </p>

            <table className="w-full text-sm">
              <tbody className="divide-y divide-hairline">
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td className="py-2 text-muted-foreground">{r.label}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNok(r.value)}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold text-navy">
                  <td className="py-2">Sum inntekt</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatNok(report.total_income)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">
                    Provisjon betalt til Verta
                  </td>
                  <td className="py-2 text-right">
                    {formatNok(report.verta_commission_paid)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">
                    Fradragsberettigede utgifter
                  </td>
                  <td className="py-2 text-right">
                    −{formatNok(report.total_expenses ?? 0)}
                  </td>
                </tr>
                <tr className="border-t border-hairline text-base font-semibold">
                  <td className="py-3 text-navy">
                    Netto utleieresultat
                    <span className="block text-xs font-normal text-muted-foreground">
                      hytte / sekundærbolig (regnskapsligning)
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {formatNok(report.net_income ?? report.total_income)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">
                    Fribeløp (egen bolig)
                  </td>
                  <td className="py-2 text-right">−{formatNok(15000)}</td>
                </tr>
                <tr className="border-t border-hairline text-base font-semibold">
                  <td className="py-3 text-navy">
                    Skattepliktig inntekt (85 %)
                    <span className="block text-xs font-normal text-muted-foreground">
                      korttidsutleie av egen bolig
                    </span>
                  </td>
                  <td className="py-3 text-right tabular-nums text-gold">
                    {formatNok(report.taxable_income)}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="mt-6 text-xs text-muted-foreground">
              To modeller vises: <strong>egen bolig</strong> (fribeløp 15 000 kr +
              85 %) og <strong>hytte/sekundærbolig</strong> (netto inntekt minus
              utgifter). Hvilken som gjelder avhenger av din situasjon — sjekk
              reglene hos Skatteetaten.
            </p>
          </div>

          <div className="flex gap-2 print:hidden">
            <PrintButton />
            <Button asChild variant="outline">
              <Link href={`/api/tax/${year}`} target="_blank">
                Last ned JSON
              </Link>
            </Button>
            <form action={generateTaxReport}>
              <input type="hidden" name="year" value={year} />
              <Button type="submit" variant="ghost">
                Oppdater tall
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

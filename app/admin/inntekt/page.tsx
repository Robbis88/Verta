import Link from "next/link";

import { requireAdmin } from "@/lib/admin";
import { getPlatformRevenue, type RevenueCategory } from "@/lib/platform-revenue";
import { formatNok } from "@/lib/utils";
import { MonthChart } from "@/components/dashboard/overview-ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MONTH_LABELS = [
  "J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D",
];

const CATEGORY_LABELS: Record<RevenueCategory, string> = {
  leie: "Utstyrsleie",
  vask: "Vask-marked",
  tillegg: "Sen/tidlig utsjekk",
  annet: "Annet",
};

export default async function AdminRevenuePage() {
  await requireAdmin();

  const year = new Date().getUTCFullYear();
  const month = new Date().getUTCMonth();
  const rev = await getPlatformRevenue(year);
  const thisMonth = rev.monthNok[month] ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-white/10 bg-navy px-4 py-3 text-white sm:px-6">
        <div className="flex items-baseline gap-3">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-gold"
          >
            Verta
          </Link>
          <span className="text-sm text-white/70">Admin · Inntekt</span>
        </div>
        <Link href="/admin" className="text-sm text-white/70 hover:text-white">
          ← Til admin
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">
            Plattforminntekt {year}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vertas 10 %-formidlingsgebyr på ekstra inntjening (utstyrsleie,
            vask, sen/tidlig utsjekk). Hentet direkte fra Stripe — netto etter
            refusjon. Selve leien er gebyrfri og telles ikke her.
          </p>
        </div>

        {!rev.configured ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Stripe er ikke konfigurert i dette miljøet.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat title={`Totalt ${year}`} value={formatNok(rev.totalNok)} />
              <Stat title="Denne måneden" value={formatNok(thisMonth)} />
              <Stat title="Transaksjoner" value={String(rev.count)} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Per måned</CardTitle>
                </CardHeader>
                <CardContent>
                  <MonthChart
                    values={rev.monthNok}
                    labels={MONTH_LABELS}
                    format={formatNok}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fordelt på type</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  {(Object.keys(CATEGORY_LABELS) as RevenueCategory[]).map(
                    (cat) => (
                      <div
                        key={cat}
                        className="flex items-center justify-between"
                      >
                        <span className="text-muted-foreground">
                          {CATEGORY_LABELS[cat]}
                        </span>
                        <span className="font-medium">
                          {formatNok(rev.byCategory[cat])}
                        </span>
                      </div>
                    ),
                  )}
                  <div className="mt-1 flex items-center justify-between border-t pt-2">
                    <span className="font-medium text-navy">Totalt</span>
                    <span className="font-semibold text-navy">
                      {formatNok(rev.totalNok)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {rev.count === 0 && (
              <p className="text-sm text-muted-foreground">
                Ingen formidlingsgebyrer registrert i {year} ennå. De dukker opp
                her så snart en gjest leier utstyr, kjøper sen/tidlig utsjekk
                eller betaler for vask.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

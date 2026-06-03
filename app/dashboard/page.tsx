import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";
import { getDashboardMetrics } from "@/lib/analytics";
import { PLANS, propertyLimit, type Plan } from "@/lib/constants";
import { formatNok } from "@/lib/utils";
import { Bar } from "@/components/analytics/bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const SOURCE_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  verta_direct: "Direkte",
  verta_instagram: "Instagram",
  verta_facebook: "Facebook",
};

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const year = new Date().getUTCFullYear();
  const m = await getDashboardMetrics(year);

  const plan: Plan = profile?.plan ?? "gratis";
  const limit = propertyLimit(plan, profile?.extra_properties_count ?? 0);
  const maxMonth = Math.max(1, ...m.byMonth);
  const maxSource = Math.max(1, ...m.bySource.map((s) => s.revenue));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Oversikt {year}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Eiendommer" value={`${m.propertyCount} / ${limit}`} />
        <Stat title="Inntekt i år" value={formatNok(m.totalRevenue)} />
        <Stat title="Belegg" value={`${m.occupancyPct} %`} />
        <Stat title="Plan" value={PLANS[plan].label} />
      </div>

      {m.propertyCount === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Kom i gang</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Du har ingen eiendommer ennå.
            </p>
            <Button asChild>
              <Link href="/dashboard/properties/new">Legg til eiendom</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inntekt per måned</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {m.byMonth.map((value, i) => (
                <Bar
                  key={i}
                  label={MONTH_LABELS[i]}
                  value={value}
                  max={maxMonth}
                  display={value ? formatNok(value) : "—"}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bookinger per kilde</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {m.bySource.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ingen bookinger i år ennå.
                </p>
              ) : (
                m.bySource.map((s) => (
                  <Bar
                    key={s.source}
                    label={SOURCE_LABELS[s.source] ?? s.source}
                    value={s.revenue}
                    max={maxSource}
                    display={`${s.count} · ${formatNok(s.revenue)}`}
                  />
                ))
              )}

              <div className="mt-4 border-t pt-3 text-sm text-muted-foreground">
                Boost: brukt {formatNok(m.boostSpend)} · inntekt{" "}
                {formatNok(m.boostRevenue)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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

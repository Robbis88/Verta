import Link from "next/link";
import {
  Wallet,
  Percent,
  CalendarClock,
  TrendingUp,
  Sparkles,
} from "lucide-react";

import { getCurrentProfile } from "@/lib/auth";
import { getDashboardMetrics } from "@/lib/analytics";
import { PLANS, propertyLimit, type Plan } from "@/lib/constants";
import { formatNok } from "@/lib/utils";
import { KpiCard, MonthChart, PanelCard } from "@/components/dashboard/overview-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MONTH_LABELS = [
  "J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D",
];

const SOURCE_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  verta_direct: "Direkte",
  verta_instagram: "Instagram",
  verta_facebook: "Facebook",
};

const TASK_TYPE_LABELS: Record<string, string> = {
  turnover: "Utvask",
  deep: "Hovedrengjøring",
  periodic: "Periodisk",
};

/** Norsk datointervall, f.eks. «14.–18. jun». */
function formatRange(checkIn: string, checkOut: string): string {
  const inD = new Date(checkIn);
  const outD = new Date(checkOut);
  const day = (d: Date) => d.getUTCDate();
  const month = new Intl.DateTimeFormat("nb-NO", {
    month: "short",
    timeZone: "UTC",
  }).format(outD);
  return `${day(inD)}.–${day(outD)}. ${month.replace(".", "")}`;
}

/** Kort dato, f.eks. «7. jul». */
function formatDay(date: string): string {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(date))
    .replace(".", "");
}

/** Trend i prosent mellom to perioder, eller null når grunnlaget mangler. */
function trendPct(current: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const year = new Date().getUTCFullYear();
  const month = new Date().getUTCMonth();
  const m = await getDashboardMetrics(year);

  const plan: Plan = profile?.plan ?? "gratis";
  const limit = propertyLimit(plan, profile?.extra_properties_count ?? 0);

  // Månedstrend på inntekt.
  const monthRevenue = m.byMonth[month] ?? 0;
  const prevRevenue = month > 0 ? m.byMonth[month - 1] : 0;
  const revTrend = trendPct(monthRevenue, prevRevenue);

  // Månedstrend på beleggsgrad (netter av tilgjengelige netter).
  const daysIn = (mo: number) => new Date(Date.UTC(year, mo + 1, 0)).getUTCDate();
  const occThis =
    m.propertyCount > 0
      ? Math.round(
          (m.nightsByMonth[month] / (m.propertyCount * daysIn(month))) * 100,
        )
      : 0;
  const occPrev =
    month > 0 && m.propertyCount > 0
      ? Math.round(
          (m.nightsByMonth[month - 1] /
            (m.propertyCount * daysIn(month - 1))) *
            100,
        )
      : 0;
  const occTrend = occPrev > 0 ? occThis - occPrev : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          Oversikt {year}
        </h1>
        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
          {PLANS[plan].label} · {m.propertyCount} / {limit} eiendommer
        </span>
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
        <>
          {/* KPI-er — merkefarget, med trend */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Inntekt mnd"
              value={formatNok(monthRevenue)}
              icon={Wallet}
              trend={revTrend != null ? `${revTrend >= 0 ? "+" : ""}${revTrend} % mot forrige mnd` : undefined}
              trendTone={revTrend != null && revTrend < 0 ? "down" : "up"}
            />
            <KpiCard
              label="Beleggsgrad"
              value={`${occThis} %`}
              icon={Percent}
              trend={occTrend != null ? `${occTrend >= 0 ? "+" : ""}${occTrend} pp mot forrige mnd` : undefined}
              trendTone={occTrend != null && occTrend < 0 ? "down" : "up"}
            />
            <KpiCard
              label="Kommende"
              value={`${m.upcomingCount}`}
              icon={CalendarClock}
              trend="bookinger"
              trendTone="muted"
            />
            <KpiCard
              label="Inntekt i år"
              value={formatNok(m.totalRevenue)}
              icon={TrendingUp}
              trend="hittil i år"
              trendTone="muted"
            />
          </div>

          {/* Inntektsgraf */}
          <PanelCard
            title="Inntekt siste 12 mnd"
            action={<span className="text-xs text-ink/50">{year}</span>}
          >
            <MonthChart
              values={m.byMonth}
              labels={MONTH_LABELS}
              format={formatNok}
            />
          </PanelCard>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Kommende bookinger */}
            <PanelCard
              title="Kommende bookinger"
              action={
                <Link
                  href="/dashboard/properties"
                  className="text-xs font-medium text-gold hover:underline"
                >
                  Se alle
                </Link>
              }
            >
              {m.upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ingen kommende bookinger.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {m.upcoming.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy">
                          {b.guestName}
                        </p>
                        <p className="truncate text-xs text-ink/60">
                          {b.propertyName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-ink/70">
                          {formatRange(b.checkIn, b.checkOut)}
                        </p>
                        <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] font-medium text-navy">
                          {SOURCE_LABELS[b.source] ?? b.source}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>

            {/* Oppgaver */}
            <PanelCard
              title="Oppgaver"
              action={
                <Link
                  href="/dashboard/rengjoring"
                  className="text-xs font-medium text-gold hover:underline"
                >
                  Se alle
                </Link>
              }
            >
              {m.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ingen kommende oppgaver.
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5 text-sm">
                  {m.tasks.map((t, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                          t.done
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-ink/30"
                        }`}
                      >
                        {t.done ? "✓" : ""}
                      </span>
                      <span
                        className={
                          t.done ? "text-ink/40 line-through" : "text-ink"
                        }
                      >
                        {TASK_TYPE_LABELS[t.type] ?? t.type} – {t.propertyName}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-ink/50">
                        {formatDay(t.date)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </div>

          {/* Bookinger per kilde */}
          <PanelCard
            title="Bookinger per kilde"
            action={
              <span className="flex items-center gap-1 text-xs text-ink/50">
                <Sparkles className="size-3.5 text-gold" />
                Boost: {formatNok(m.boostSpend)} → {formatNok(m.boostRevenue)}
              </span>
            }
          >
            {m.bySource.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ingen bookinger i år ennå.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {m.bySource.map((s) => {
                  const maxSource = Math.max(
                    1,
                    ...m.bySource.map((x) => x.revenue),
                  );
                  const pct = Math.round((s.revenue / maxSource) * 100);
                  return (
                    <li key={s.source} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-ink/70">
                        {SOURCE_LABELS[s.source] ?? s.source}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-cloud">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-28 shrink-0 text-right tabular-nums text-navy">
                        {s.count} · {formatNok(s.revenue)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelCard>
        </>
      )}
    </div>
  );
}

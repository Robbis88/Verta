import Link from "next/link";
import {
  Wallet,
  Percent,
  CalendarClock,
  TrendingUp,
  Sparkles,
} from "lucide-react";

import { getCurrentProfile } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardMetrics } from "@/lib/analytics";
import { resolveAlert, markGuestLinkSent } from "./alert-actions";
import { CopyButton } from "@/components/shared/copy-button";
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

  // Åpne forespørsler (booking som venter på eierens godkjenning). RLS scoper
  // begge spørringene til innlogget eier. Vises rødt og blinkende øverst så
  // eieren fanger dem opp selv om e-posten ble oversett.
  const supabase = await createClient();
  const { data: propRows } = await supabase.from("properties").select("id,name");
  const propName = new Map(
    (propRows ?? []).map((p) => [p.id as string, p.name as string]),
  );
  const { data: reqRows } = await supabase
    .from("bookings")
    .select("id,guest_name,check_in,check_out,property_id")
    .eq("status", "requested")
    .order("created_at", { ascending: true });
  const requests = (reqRows ?? []) as {
    id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    property_id: string;
  }[];

  // Bookinger der gjestelenken ennå ikke er markert som sendt. Gjelder kommende/
  // pågående opphold med gjestetoken (også Airbnb/Booking eieren registrerer
  // selv). En gyllen påminnelse nudger eieren til å sende lenken.
  const todayStr = new Date().toISOString().slice(0, 10);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verta.no";
  const { data: unsentRows } = await supabase
    .from("bookings")
    .select("id,guest_name,check_in,check_out,property_id,guest_token,source")
    .eq("guest_link_sent", false)
    .not("guest_token", "is", null)
    .not("status", "in", "(cancelled,requested)")
    .gte("check_out", todayStr)
    .order("check_in", { ascending: true });
  const unsentLinks = (unsentRows ?? []) as {
    id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    property_id: string;
    guest_token: string;
    source: string;
  }[];

  // Uløste kritiske varsler (refusjons-svikt, foreldreløse betalinger). Admin
  // ser alt (også plattform-nivå); eier ser kun sine egne (via RLS).
  const admin = isAdmin(profile?.email);
  const alertClient = admin ? createAdminClient() : supabase;
  const { data: alertRows } = await alertClient
    .from("critical_alerts")
    .select("id,kind,title,created_at")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(20);
  const criticalAlerts = (alertRows ?? []) as {
    id: string;
    kind: string;
    title: string;
    created_at: string;
  }[];

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

      {criticalAlerts.length > 0 && (
        <div className="rounded-xl border-2 border-red-600 bg-red-100 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex size-2.5 animate-blink rounded-full bg-red-700" />
            <h2 className="text-sm font-bold text-red-800">
              {criticalAlerts.length} kritisk
              {criticalAlerts.length === 1 ? "" : "e"} varsel
              {criticalAlerts.length === 1 ? "" : "er"} — betaling/refusjon
            </h2>
          </div>
          <ul className="flex flex-col gap-2">
            {criticalAlerts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">
                    {a.title}
                  </p>
                  <p className="text-xs text-ink/60">
                    {a.kind === "refund_failed"
                      ? "Refusjon feilet — gjesten er ikke tilbakebetalt"
                      : "Betaling mottatt uten match — sjekk Stripe/Connect"}
                  </p>
                </div>
                <form action={resolveAlert}>
                  <input type="hidden" name="id" value={a.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-red-700 hover:text-red-800"
                  >
                    Marker som løst
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      {requests.length > 0 && (
        <div className="rounded-xl border-2 border-red-500 bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex size-2.5 animate-blink rounded-full bg-red-600" />
            <h2 className="text-sm font-bold text-red-700">
              {requests.length}{" "}
              {requests.length === 1
                ? "forespørsel venter på svar"
                : "forespørsler venter på svar"}
            </h2>
          </div>
          <ul className="flex flex-col gap-2">
            {requests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/properties/${r.property_id}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm transition hover:bg-red-100/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy">
                      {r.guest_name}
                    </p>
                    <p className="truncate text-xs text-ink/60">
                      {propName.get(r.property_id) ?? ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-ink/70">
                      {formatRange(r.check_in, r.check_out)}
                    </span>
                    <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white">
                      Svar nå
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {unsentLinks.length > 0 && (
        <div className="rounded-xl border-2 border-gold bg-gold/10 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="size-4 text-gold" />
            <h2 className="text-sm font-bold text-navy">
              {unsentLinks.length}{" "}
              {unsentLinks.length === 1 ? "booking mangler" : "bookinger mangler"}{" "}
              gjestelenke
            </h2>
          </div>
          <p className="mb-3 text-xs text-ink/60">
            Send oppholdslenken til gjesten (innsjekk, WiFi, dørkode og tillegg).
            Kopier og lim inn i meldingen — også til Airbnb/Booking-gjester.
          </p>
          <ul className="flex flex-col gap-2">
            {unsentLinks.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">
                    {b.guest_name}
                  </p>
                  <p className="truncate text-xs text-ink/60">
                    {propName.get(b.property_id) ?? ""} ·{" "}
                    {SOURCE_LABELS[b.source] ?? b.source} ·{" "}
                    {formatRange(b.check_in, b.check_out)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <CopyButton
                    label="Kopier melding"
                    text={`Hei${b.guest_name ? " " + b.guest_name : ""}! Her er din digitale gjesteside for oppholdet — innsjekk, WiFi, dørkode og alt du trenger på ett sted:\n${siteUrl}/gjest/${b.guest_token}\n\nHi! Here's your digital guest page with check-in info, WiFi and everything for your stay:\n${siteUrl}/gjest/${b.guest_token}`}
                  />
                  <form action={markGuestLinkSent}>
                    <input type="hidden" name="id" value={b.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-emerald-700 hover:text-emerald-800"
                    >
                      Marker som sendt ✓
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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

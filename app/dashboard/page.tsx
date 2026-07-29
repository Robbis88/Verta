import { Sparkles } from "lucide-react";

import { getCurrentProfile } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardMetrics } from "@/lib/analytics";
import { resolveAlert } from "./alert-actions";
import { SendGuestLinkButton } from "@/components/dashboard/send-guest-link-button";
import { PLANS, propertyLimit, type Plan } from "@/lib/constants";
import { formatNok } from "@/lib/utils";
import { MonthChart } from "@/components/dashboard/overview-ui";
import {
  Flate,
  Handling,
  Liste,
  Merke,
  Rad,
  Side,
  Situasjon,
  Tall,
  TallRekke,
  Tomt,
} from "@/components/hus";

/**
 * Oversikten — modul 10 i UI-refaktoren. Samme spørringer, samme tall, samme
 * actions. Kortene er byttet mot husets Flate/TallRekke/Liste.
 */

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
  // begge spørringene til innlogget eier.
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
  // selv).
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

  const venter =
    criticalAlerts.length + requests.length + unsentLinks.length;

  return (
    <Side bred>
      <Situasjon
        merke="Oversikt"
        tittel={
          venter === 0
            ? "Ingenting venter på deg."
            : venter === 1
              ? "Én ting venter på deg."
              : `${venter} ting venter på deg.`
        }
        under={
          venter === 0
            ? `Alt er i rute. Resten av siden er tallene for ${year}.`
            : "Alt som venter står samlet øverst. Resten av siden er bare tall."
        }
        handling={
          <Merke tone="gull">
            {PLANS[plan].label} · {m.propertyCount} / {limit} eiendommer
          </Merke>
        }
      />

      {venter > 0 && (
        <Flate tittel="Trenger deg" hva="Alt som venter, samlet.">
          <Liste>
            {criticalAlerts.map((a) => (
              <Rad
                key={a.id}
                hva={a.title}
                detalj={
                  a.kind === "refund_failed"
                    ? "Refusjon feilet — gjesten er ikke tilbakebetalt"
                    : "Betaling mottatt uten match — sjekk Stripe/Connect"
                }
                tone="kritisk"
                verdi="Kritisk"
                handling={
                  <form action={resolveAlert}>
                    <input type="hidden" name="id" value={a.id} />
                    <Handling type="submit" vekt="naken">
                      Marker løst
                    </Handling>
                  </form>
                }
              />
            ))}

            {requests.map((r) => (
              <Rad
                key={r.id}
                hva={`${r.guest_name} har spurt om å få bo hos deg`}
                detalj={`${propName.get(r.property_id) ?? ""} · ${formatRange(
                  r.check_in,
                  r.check_out,
                )}`}
                handling={
                  <Handling href={`/hjem/opphold/${r.id}`} vekt="naken">
                    Svar →
                  </Handling>
                }
              />
            ))}

            {unsentLinks.map((b) => (
              <Rad
                key={b.id}
                hva={`${b.guest_name} har ikke fått gjestelenken`}
                detalj={`${propName.get(b.property_id) ?? ""} · ${
                  SOURCE_LABELS[b.source] ?? b.source
                } · ${formatRange(b.check_in, b.check_out)}`}
                handling={
                  <span className="flex items-center gap-1">
                    <SendGuestLinkButton
                      bookingId={b.id}
                      message={`Hei${b.guest_name ? " " + b.guest_name : ""}! Her er din digitale gjesteside for oppholdet — innsjekk, WiFi, dørkode og alt du trenger på ett sted:
${siteUrl}/gjest/${b.guest_token}

Hi! Here's your digital guest page with check-in info, WiFi and everything for your stay:
${siteUrl}/gjest/${b.guest_token}`}
                    />
                    <Handling href={`/hjem/opphold/${b.id}`} vekt="naken">
                      Åpne
                    </Handling>
                  </span>
                }
              />
            ))}
          </Liste>
        </Flate>
      )}

      {m.propertyCount === 0 ? (
        <Flate>
          <Tomt
            tittel="Du har ingen eiendommer ennå."
            hva="Legg inn boligen din, så begynner Verta å regne — inntekt, belegg, oppgaver og skatt."
            knappTekst="Legg til eiendom"
            knappHref="/dashboard/properties/new"
          />
        </Flate>
      ) : (
        <>
          <TallRekke>
            <Tall
              navn="Inntekt mnd"
              verdi={formatNok(monthRevenue)}
              tone="gull"
            />
            <Tall
              navn="Beleggsgrad"
              verdi={`${occThis} %`}
              tone={occTrend != null && occTrend < 0 ? "obs" : "ro"}
            />
            <Tall navn="Kommende" verdi={`${m.upcomingCount}`} />
            <Tall
              navn="Inntekt i år"
              verdi={formatNok(m.totalRevenue)}
              tone="gull"
            />
          </TallRekke>

          <p className="text-sm text-hus-svak">
            {revTrend != null
              ? `Inntekten er ${revTrend >= 0 ? "opp" : "ned"} ${Math.abs(revTrend)} % mot forrige måned`
              : "Første måned med tall"}
            {occTrend != null &&
              `, og beleggsgraden ${occTrend >= 0 ? "opp" : "ned"} ${Math.abs(occTrend)} prosentpoeng`}
            .
          </p>

          <Flate tittel={`Inntekt siste 12 mnd`} hva={`Året ${year}, måned for måned.`}>
            <MonthChart
              values={m.byMonth}
              labels={MONTH_LABELS}
              format={formatNok}
              tone="hus"
            />
          </Flate>

          <div className="grid gap-6 lg:grid-cols-2">
            <Flate
              tittel="Kommende bookinger"
              hva="De neste gjestene dine."
              handling={
                <Handling href="/dashboard/properties" vekt="naken">
                  Se alle
                </Handling>
              }
            >
              {m.upcoming.length === 0 ? (
                <Tomt
                  tittel="Ingen kommende bookinger."
                  hva="Del bookinglenken din, så fyller kalenderen seg."
                />
              ) : (
                <Liste>
                  {m.upcoming.map((b, i) => (
                    <Rad
                      key={b.id ?? i}
                      href={`/hjem/opphold/${b.id}`}
                      hva={
                        <span className="flex items-center gap-2">
                          <span className="truncate">{b.guestName}</span>
                          <Merke>{SOURCE_LABELS[b.source] ?? b.source}</Merke>
                        </span>
                      }
                      detalj={b.propertyName}
                      verdi={formatRange(b.checkIn, b.checkOut)}
                    />
                  ))}
                </Liste>
              )}
            </Flate>

            <Flate
              tittel="Oppgaver"
              hva="Vask og vedlikehold som står for tur."
              handling={
                <Handling href="/dashboard/rengjoring" vekt="naken">
                  Se alle
                </Handling>
              }
            >
              {m.tasks.length === 0 ? (
                <Tomt
                  tittel="Ingen kommende oppgaver."
                  hva="Verta lager utvask automatisk når en gjest sjekker ut."
                />
              ) : (
                <Liste>
                  {m.tasks.map((t, i) => (
                    <Rad
                      key={i}
                      hva={
                        <span
                          className={t.done ? "text-hus-svak line-through" : ""}
                        >
                          {TASK_TYPE_LABELS[t.type] ?? t.type} – {t.propertyName}
                        </span>
                      }
                      verdi={formatDay(t.date)}
                      tone={t.done ? "ro" : "obs"}
                    />
                  ))}
                </Liste>
              )}
            </Flate>
          </div>

          <Flate
            tittel="Bookinger per kilde"
            hva="Hvor gjestene dine faktisk kommer fra."
            handling={
              <span className="flex items-center gap-1.5 text-xs text-hus-svak">
                <Sparkles className="size-3.5 text-hus-gull" />
                Boost: {formatNok(m.boostSpend)} → {formatNok(m.boostRevenue)}
              </span>
            }
          >
            {m.bySource.length === 0 ? (
              <Tomt
                tittel="Ingen bookinger i år ennå."
                hva="Så snart den første kommer inn, ser du fordelingen her."
              />
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
                      <span className="w-24 shrink-0 truncate text-hus-dempet">
                        {SOURCE_LABELS[s.source] ?? s.source}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-hus-gull/60 to-hus-gull"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-28 shrink-0 text-right tabular-nums text-hus-blekk">
                        {s.count} · {formatNok(s.revenue)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Flate>
        </>
      )}
    </Side>
  );
}

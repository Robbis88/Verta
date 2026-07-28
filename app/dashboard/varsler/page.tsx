import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { runScan, dismissAlert, resolveAlert } from "./actions";
import { AlertCampaign } from "@/components/alerts/alert-campaign";
import { Flate, Handling, Side, Situasjon, Tomt } from "@/components/hus";

/**
 * Varsler — modul 3 i UI-refaktoren. Kun presentasjon; samme spørring og
 * samme tre handlinger (runScan, resolveAlert, dismissAlert).
 */

type Alert = {
  id: string;
  property_id: string;
  type: string;
  severity: string;
  message: string;
};

/** Alvorlighet som en tynn stripe i kanten, ikke som en farget boks. */
const STRIPE: Record<string, string> = {
  critical: "border-l-hus-kritisk",
  warning: "border-l-hus-obs",
  normal: "border-l-hus-gull",
};

export default async function VarslerPage() {
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("empty_date_alerts")
    .select("id,property_id,type,severity,message")
    .eq("status", "pending")
    .order("severity", { ascending: true })
    .order("created_at", { ascending: false });
  const alerts = (data ?? []) as Alert[];

  const kritiske = alerts.filter((a) => a.severity === "critical").length;

  const skann = (
    <form action={runScan}>
      <Handling type="submit" vekt={alerts.length === 0 ? "gull" : "stille"}>
        Skann nå
      </Handling>
    </form>
  );

  return (
    <Side>
      <Situasjon
        merke="Varsler"
        tittel={
          alerts.length === 0
            ? "Ingenting roper på deg akkurat nå."
            : kritiske > 0
              ? `${kritiske} av ${alerts.length} varsler haster.`
              : `${alerts.length} ${alerts.length === 1 ? "periode" : "perioder"} er verdt å gjøre noe med.`
        }
        under="Verta skanner de neste 60 dagene etter lavt belegg, store hull og tomme datoer som nærmer seg — og skriver kampanjen for deg."
        handling={skann}
      />

      {alerts.length === 0 ? (
        <Flate>
          <Tomt
            tittel="Ingen aktive varsler."
            hva="Trykk «Skann nå», så går Verta gjennom kalenderen din og sier fra hvis noe er verdt å fylle."
          />
        </Flate>
      ) : (
        <div className="flex flex-col gap-4">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`hus-seksjon hus-stig rounded-2xl border border-l-2 border-hus-linje bg-[linear-gradient(180deg,rgba(245,247,250,0.045),rgba(245,247,250,0.02))] p-5 sm:p-6 ${
                STRIPE[a.severity] ?? STRIPE.normal
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-balance text-base leading-relaxed text-hus-blekk">
                  {a.message}
                </p>
                <div className="flex shrink-0 gap-1">
                  <form action={resolveAlert}>
                    <input type="hidden" name="id" value={a.id} />
                    <Handling type="submit" vekt="naken">
                      Løst
                    </Handling>
                  </form>
                  <form action={dismissAlert}>
                    <input type="hidden" name="id" value={a.id} />
                    <Handling type="submit" vekt="naken">
                      Skjul
                    </Handling>
                  </form>
                </div>
              </div>
              <div className="mt-4">
                <AlertCampaign alertId={a.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Side>
  );
}

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { runScan, dismissAlert, resolveAlert } from "./actions";
import { AlertCampaign } from "@/components/alerts/alert-campaign";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Alert = {
  id: string;
  property_id: string;
  type: string;
  severity: string;
  message: string;
};

const SEVERITY_STYLE: Record<string, string> = {
  critical: "border-l-red-500 bg-red-50",
  warning: "border-l-amber-500 bg-amber-50",
  normal: "border-l-gold bg-cloud",
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Varsler</h1>
          <p className="text-sm text-muted-foreground">
            Verta skanner de neste 60 dagene og varsler om lavt belegg, store
            hull og nært forestående tomme datoer — med ferdig kampanje på ett
            klikk.
          </p>
        </div>
        <form action={runScan}>
          <Button type="submit">Skann nå</Button>
        </form>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Ingen aktive varsler. Trykk «Skann nå» for å sjekke kommende datoer.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={`flex flex-col gap-3 rounded-lg border border-l-4 p-4 ${
                SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.normal
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-navy">{a.message}</p>
                <div className="flex shrink-0 gap-2">
                  <form action={resolveAlert}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Løst
                    </Button>
                  </form>
                  <form action={dismissAlert}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Skjul
                    </Button>
                  </form>
                </div>
              </div>
              <AlertCampaign alertId={a.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

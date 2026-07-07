import { Banknote, CalendarDays } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatNok } from "@/lib/utils";
import { KpiCard, PanelCard } from "@/components/dashboard/overview-ui";

type CommissionRow = {
  id: string;
  period: string;
  total_revenue: number | null;
  commission_amount: number | null;
  status: string;
};

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  invoiced: "bg-cloud text-navy",
};

export default async function CommissionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commissions")
    .select("id,period,total_revenue,commission_amount,status")
    .order("period", { ascending: false });
  const commissions = (data ?? []) as CommissionRow[];

  const lifetime = commissions.reduce(
    (sum, c) => sum + (Number(c.commission_amount) || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">Provisjon</h1>
        <p className="text-sm text-muted-foreground">
          10 % av bookinger fra Vertas kanaler. Beregnes månedlig.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          label="Totalt opptjent"
          value={formatNok(lifetime)}
          icon={Banknote}
          trend="til Verta hittil"
          trendTone="muted"
        />
        <KpiCard
          label="Perioder"
          value={`${commissions.length}`}
          icon={CalendarDays}
          trend="registrert"
          trendTone="muted"
        />
      </div>

      <PanelCard title="Perioder">
        {commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ingen provisjon registrert ennå.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-hairline">
            {commissions.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
              >
                <span className="w-20 font-medium text-navy">{c.period}</span>
                <span className="text-ink/60">
                  Omsetning {formatNok(Number(c.total_revenue) || 0)}
                </span>
                <span className="font-semibold tabular-nums text-navy">
                  {formatNok(Number(c.commission_amount) || 0)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_STYLE[c.status] ?? "bg-cloud text-navy"
                  }`}
                >
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { formatNok } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CommissionRow = {
  id: string;
  period: string;
  total_revenue: number | null;
  commission_amount: number | null;
  status: string;
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
        <h1 className="text-2xl font-semibold">Provisjon</h1>
        <p className="text-sm text-muted-foreground">
          10 % av bookinger fra Vertas kanaler. Beregnes månedlig.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Totalt opptjent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatNok(lifetime)}</p>
        </CardContent>
      </Card>

      {commissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ingen provisjon registrert ennå.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {commissions.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium">{c.period}</span>
              <span className="text-muted-foreground">
                Omsetning {formatNok(Number(c.total_revenue) || 0)}
              </span>
              <span>{formatNok(Number(c.commission_amount) || 0)}</span>
              <Badge>{c.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

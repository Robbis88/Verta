import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { formatNok } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BoostRow = {
  id: string;
  property_id: string;
  status: string;
  budget_nok: number;
  platform: string;
  created_at: string;
};

export default async function BoostsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("boosts")
    .select("id,property_id,status,budget_nok,platform,created_at")
    .order("created_at", { ascending: false });
  const boosts = (data ?? []) as BoostRow[];

  const ids = [...new Set(boosts.map((b) => b.property_id))];
  const { data: props } = ids.length
    ? await supabase.from("properties").select("id,name").in("id", ids)
    : { data: [] };
  const nameById = new Map(
    ((props ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Boost-kampanjer</h1>
        <Button asChild>
          <Link href="/dashboard/boosts/new">Ny boost</Link>
        </Button>
      </div>

      {boosts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ingen kampanjer ennå. Lag en boost for å nå flere gjester.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {boosts.map((b) => (
            <Link key={b.id} href={`/dashboard/boosts/${b.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{nameById.get(b.property_id) ?? "Eiendom"}</span>
                    <Badge>{b.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {formatNok(Number(b.budget_nok))} · {b.platform}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

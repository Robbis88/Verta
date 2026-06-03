import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLANS, propertyLimit, type Plan } from "@/lib/constants";
import { formatNok } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: properties } = await supabase.from("properties").select("id");
  const { data: bookings } = await supabase
    .from("bookings")
    .select("total_price,status");

  const plan: Plan = profile?.plan ?? "gratis";
  const propertyCount = properties?.length ?? 0;
  const limit = propertyLimit(plan, profile?.extra_properties_count ?? 0);
  const bookingCount = bookings?.length ?? 0;
  const revenue = (bookings ?? []).reduce(
    (sum, b) => sum + (Number(b.total_price) || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Oversikt</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Eiendommer" value={`${propertyCount} / ${limit}`} />
        <Stat title="Bookinger" value={String(bookingCount)} />
        <Stat title="Inntekt" value={formatNok(revenue)} />
        <Stat title="Plan" value={PLANS[plan].label} />
      </div>

      {propertyCount === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kom i gang</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Du har ingen eiendommer ennå. Legg til din første for å komme i
              gang.
            </p>
            <Button asChild>
              <Link href="/dashboard/properties/new">Legg til eiendom</Link>
            </Button>
          </CardContent>
        </Card>
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

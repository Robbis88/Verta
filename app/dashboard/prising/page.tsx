import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PricingTool } from "@/components/pricing/pricing-tool";
import {
  SeasonalRates,
  type PriceProperty,
  type Season,
} from "@/components/pricing/seasonal-rates";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PrisingPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: props } = await supabase
    .from("properties")
    .select("id,name,base_nightly_rate,cleaning_fee")
    .order("name");
  const properties = (props ?? []) as PriceProperty[];

  const propertyIds = properties.map((p) => p.id);
  const { data: seasonData } = propertyIds.length
    ? await supabase
        .from("seasonal_rates")
        .select("id,property_id,name,date_from,date_to,nightly_rate")
        .in("property_id", propertyIds)
    : { data: [] };
  const seasons = (seasonData ?? []) as Season[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Prising</h1>
        <p className="text-sm text-muted-foreground">
          Sett basepris og sesongpriser, så regnes totalprisen ut automatisk på
          nye bookinger. Få også AI-forslag til nattepriser basert på
          beliggenhet, størrelse og belegg de neste 90 dagene.
        </p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Legg til en eiendom først.{" "}
            <Link href="/dashboard/properties/new" className="underline">
              Legg til eiendom
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Faste priser og sesonger</CardTitle>
            </CardHeader>
            <CardContent>
              <SeasonalRates properties={properties} seasons={seasons} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI-prisforslag</CardTitle>
            </CardHeader>
            <CardContent>
              <PricingTool properties={properties} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

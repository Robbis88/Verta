import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PricingTool } from "@/components/pricing/pricing-tool";
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
    .select("id,name")
    .order("name");
  const properties = (props ?? []) as { id: string; name: string }[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Prising</h1>
        <p className="text-sm text-muted-foreground">
          Få AI-forslag til nattepriser per sesong, basert på beliggenhet,
          størrelse og hvor fullt det er de neste 90 dagene.
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
        <Card>
          <CardHeader>
            <CardTitle>Prisforslag</CardTitle>
          </CardHeader>
          <CardContent>
            <PricingTool properties={properties} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

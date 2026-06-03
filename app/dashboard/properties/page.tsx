import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { propertyLimit, type Plan } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: properties } = await supabase
    .from("properties")
    .select("id,name,address,max_guests,slug")
    .order("created_at", { ascending: true });

  const plan: Plan = profile?.plan ?? "gratis";
  const limit = propertyLimit(plan, profile?.extra_properties_count ?? 0);
  const count = properties?.length ?? 0;
  const canAdd = count < limit;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Eiendommer</h1>
          <p className="text-sm text-muted-foreground">
            {count} av {limit} brukt
          </p>
        </div>
        {canAdd ? (
          <Button asChild>
            <Link href="/dashboard/properties/new">Legg til eiendom</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/dashboard">Oppgrader for flere</Link>
          </Button>
        )}
      </div>

      {count === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ingen eiendommer ennå.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {properties!.map((p) => (
            <Link key={p.id} href={`/dashboard/properties/${p.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {p.address || "Ingen adresse"}
                  {p.max_guests ? ` · ${p.max_guests} gjester` : ""}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { BoostForm } from "@/components/boosts/boost-form";
import { Button } from "@/components/ui/button";

export default async function NewBoostPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id,name")
    .order("created_at", { ascending: true });
  const properties = (data ?? []) as { id: string; name: string }[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Ny boost</h1>

      {properties.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Du må ha minst én eiendom før du kan lage en boost.
          </p>
          <Button asChild>
            <Link href="/dashboard/properties/new">Legg til eiendom</Link>
          </Button>
        </div>
      ) : (
        <BoostForm properties={properties} />
      )}
    </div>
  );
}

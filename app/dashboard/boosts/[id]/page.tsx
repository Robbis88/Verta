import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { payBoost } from "../actions";
import { BoostEditor } from "@/components/boosts/boost-editor";
import { formatNok } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Boost } from "@/lib/types";

export default async function BoostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; payment_failed?: string }>;
}) {
  const { id } = await params;
  const { paid, payment_failed } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("boosts").select("*").eq("id", id).single();
  if (!data) notFound();
  const boost = data as Boost;

  const { data: property } = await supabase
    .from("properties")
    .select("name,slug")
    .eq("id", boost.property_id)
    .single();

  const defaultText = boost.user_approved_text ?? boost.ai_generated_text ?? "";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Boost — {property?.name ?? "Eiendom"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatNok(Number(boost.budget_nok))} · {boost.platform} ·{" "}
            {boost.start_date} → {boost.end_date}
          </p>
        </div>
        <Badge>{boost.status}</Badge>
      </div>

      {paid && (
        <p className="rounded-lg border border-hairline bg-cloud p-4 text-sm text-navy">
          Boosten er godkjent og betalt!
        </p>
      )}
      {payment_failed && (
        <p className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
          Betalingen ble ikke fullført. Prøv igjen.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Annonsetekst</CardTitle>
        </CardHeader>
        <CardContent>
          <BoostEditor id={boost.id} defaultText={defaultText} />
        </CardContent>
      </Card>

      {boost.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Godkjenn og betal</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Betal {formatNok(Number(boost.budget_nok))} for å aktivere
              kampanjen.
            </p>
            <form action={payBoost}>
              <input type="hidden" name="id" value={boost.id} />
              <Button type="submit">Godkjenn og betal med Vipps</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Link
        href="/dashboard/boosts"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Tilbake til kampanjer
      </Link>
    </div>
  );
}

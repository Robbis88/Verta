import Link from "next/link";
import { redirect } from "next/navigation";

import { choosePlan } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/constants";
import { stripeEnabled } from "@/lib/stripe";
import { cn, formatNok } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const tiers = [
  { key: "basis" as const, blurb: "Kalender, bookingside, skatt-rapport, AI-annonse." },
  {
    key: "pluss" as const,
    blurb: "Alt i Basis + multi-kanal, boost, SMS og analytics.",
    highlighted: true,
  },
  {
    key: "premium" as const,
    blurb: "Alt i Pluss + smartlås, priority support og API-tilgang.",
  },
];

export default async function PlanPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true });

  // Må ha opprettet en eiendom først (steg 1).
  if (!count) redirect("/onboarding");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Steg 2 av 2</p>
        <h1 className="text-2xl font-semibold">Velg plan</h1>
        {stripeEnabled && (
          <p className="mt-2 text-sm text-muted-foreground">
            Prøv gratis i 14 dager. Kortet trekkes først når prøveperioden er
            over — du kan avslutte når som helst.
          </p>
        )}
        {!stripeEnabled && (
          <p className="mt-2 text-xs text-muted-foreground">
            Dev-modus: Stripe er ikke konfigurert, så planen aktiveres direkte
            uten betaling.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {tiers.map((tier) => {
          const plan = PLANS[tier.key];
          return (
            <Card
              key={tier.key}
              className={cn(tier.highlighted && "border-gold")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.label}</span>
                  <span className="text-base font-normal text-muted-foreground">
                    {formatNok(plan.priceNok)}/mnd
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">{tier.blurb}</p>
                <form action={choosePlan}>
                  <input type="hidden" name="tier" value={tier.key} />
                  <Button type="submit" variant={tier.highlighted ? "default" : "outline"}>
                    {stripeEnabled ? `Start ${plan.label}` : `Velg ${plan.label}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alltid tilgjengelig — også for brukere uten aktivt abonnement som havner
          her via betalingsmuren. GDPR: rett til dataeksport og sletting skal ikke
          være låst bak betaling. */}
      <div className="mt-4 flex flex-col items-start gap-3 border-t border-hairline pt-6">
        <p className="text-sm font-medium">Vil du ikke fortsette?</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/api/gdpr/export" target="_blank">
            Last ned mine data (JSON)
          </Link>
        </Button>
        <DeleteAccountButton />
      </div>
    </div>
  );
}

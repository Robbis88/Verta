import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";
import { PLANS, type Plan } from "@/lib/constants";
import { stripeEnabled } from "@/lib/stripe";
import { openBillingPortal, purchaseExtraProperty } from "./actions";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  const plan: Plan = profile?.plan ?? "gratis";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Innstillinger</h1>

      <Card>
        <CardHeader>
          <CardTitle>Konto</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">E-post:</span>{" "}
            {profile?.email}
          </p>
          <p>
            <span className="text-muted-foreground">Plan:</span>{" "}
            {PLANS[plan].label}
          </p>
        </CardContent>
      </Card>

      {stripeEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Abonnement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3 text-sm">
            <p className="text-muted-foreground">
              Nåværende plan: {PLANS[plan].label}
            </p>
            <form action={openBillingPortal}>
              <Button type="submit" variant="outline">
                Administrer abonnement
              </Button>
            </form>
            {plan === "premium" && (
              <form action={purchaseExtraProperty}>
                <Button type="submit">Kjøp ekstra eiendom (+99 kr/mnd)</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personvern (GDPR)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3 text-sm">
          <p className="text-muted-foreground">
            Last ned en kopi av alle data vi har lagret om deg.
          </p>
          <Button asChild variant="outline">
            <Link href="/api/gdpr/export" target="_blank">
              Last ned mine data (JSON)
            </Link>
          </Button>
          <p className="text-muted-foreground">
            Se også{" "}
            <Link href="/personvern" className="underline">
              personvernerklæringen
            </Link>
            ,{" "}
            <Link href="/databehandleravtale" className="underline">
              databehandleravtalen
            </Link>{" "}
            og{" "}
            <Link href="/vilkar" className="underline">
              vilkårene
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Faresone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3 text-sm">
          <p className="text-muted-foreground">
            Sletting fjerner kontoen din og alle tilknyttede data permanent.
          </p>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}

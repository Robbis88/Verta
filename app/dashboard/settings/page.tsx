import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";
import {
  PLANS,
  EXTRA_PROPERTY_PRICE_NOK,
  EXTRA_PROPERTY_YEARLY_PRICE_NOK,
  type Plan,
} from "@/lib/constants";
import { formatNok } from "@/lib/utils";
import { stripeEnabled } from "@/lib/stripe";
import {
  openBillingPortal,
  purchaseExtraProperty,
  startConnectOnboarding,
  openConnectDashboard,
} from "./actions";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ utbetaling?: string; abonnement?: string }>;
}) {
  const profile = await getCurrentProfile();
  const plan: Plan = profile?.plan ?? "gratis";
  const { utbetaling, abonnement } = await searchParams;

  const hasConnect = Boolean(profile?.stripe_connect_id);
  const payoutsReady = profile?.payouts_enabled === true;

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
            {abonnement === "mangler" && (
              <p className="text-amber-600">
                Vi finner ingen aktiv Stripe-kunde på kontoen din, så det er
                ingen abonnement å administrere ennå. Planen din er trolig satt
                manuelt uten et Stripe-abonnement.
              </p>
            )}
            {abonnement === "feil" && (
              <p className="text-red-600">
                Kunne ikke åpne abonnementsportalen. I live-modus må Stripe
                Customer Portal aktiveres først (Stripe → Innstillinger →
                Betaling → Kundeportal → Aktiver).
              </p>
            )}
            <form action={openBillingPortal}>
              <Button type="submit" variant="outline">
                Administrer abonnement
              </Button>
            </form>
            {plan === "premium" && (
              <div className="flex flex-col items-start gap-1">
                <form action={purchaseExtraProperty}>
                  <Button type="submit">Kjøp ekstra eiendom</Button>
                </form>
                <p className="text-xs text-muted-foreground">
                  {formatNok(EXTRA_PROPERTY_PRICE_NOK)}/mnd — eller{" "}
                  {formatNok(EXTRA_PROPERTY_YEARLY_PRICE_NOK)}/år hvis du har
                  årsplan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {stripeEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Utbetaling for utleie</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3 text-sm">
            {utbetaling === "klar" && (
              <p className="text-emerald-600">
                Utbetaling er nå aktivert. Gjester kan betale bookinger direkte
                til deg.
              </p>
            )}
            {utbetaling === "ufullstendig" && (
              <p className="text-amber-600">
                Oppsettet er ikke ferdig ennå. Fullfør registreringen hos Stripe
                for å kunne motta betaling.
              </p>
            )}
            {utbetaling === "feil" && (
              <p className="text-red-600">
                Noe gikk galt da vi prøvde å koble utbetaling. Prøv igjen.
                Vedvarer det, er Stripe Connect trolig ikke ferdig aktivert i
                live-modus ennå (fullfør plattformprofilen i Stripe).
              </p>
            )}
            {utbetaling === "gebyr" && (
              <p className="text-amber-600">
                Du må huke av bekreftelsen om kortgebyr før du kan koble
                utbetaling.
              </p>
            )}

            {payoutsReady ? (
              <>
                <p className="text-muted-foreground">
                  Status:{" "}
                  <span className="font-medium text-emerald-600">Aktiv</span> —
                  gjestene betaler <strong>deg direkte</strong>. Verta tar ingen
                  provisjon på leien. Kortgebyr fra Stripe (~2–3 %) trekkes av
                  dine utbetalinger — du ser <strong>brutto → kortgebyr →
                  netto</strong> per betaling i Stripe-dashbordet.
                </p>
                <form action={openConnectDashboard}>
                  <Button type="submit" variant="outline">
                    Åpne Stripe-dashbordet
                  </Button>
                </form>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Koble til din egen Stripe-konto, så betaler gjestene deg{" "}
                  <strong>direkte</strong> når de booker. Du er selger, Verta tar{" "}
                  <strong>0 % av leien</strong>. Kortgebyret (~2–3 %) fra Stripe
                  trekkes av dine utbetalinger.
                </p>
                <form
                  action={startConnectOnboarding}
                  className="flex flex-col items-start gap-3"
                >
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      name="gebyr"
                      required
                      className="mt-0.5 h-4 w-4"
                    />
                    <span>
                      Jeg forstår at kortgebyr (~2–3 %) belastes min Stripe-konto,
                      og at Verta ikke tar provisjon på leien.
                    </span>
                  </label>
                  <Button type="submit">
                    {hasConnect ? "Fullfør oppsett" : "Koble utbetaling"}
                  </Button>
                </form>
              </>
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

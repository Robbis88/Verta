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
import {
  Beskjed,
  Flate,
  Handling,
  Liste,
  Rad,
  Side,
  Situasjon,
} from "@/components/hus";

/**
 * Innstillinger — modul 8. Kun presentasjon; samme actions og samme
 * søkeparametre (utbetaling, abonnement).
 */
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
    <Side>
      <Situasjon
        merke="Innstillinger"
        tittel={`Du er på ${PLANS[plan].label}.`}
        under={
          payoutsReady
            ? "Utbetaling er aktivert — gjestene betaler deg direkte."
            : "Her styrer du abonnement, utbetaling og dine egne data."
        }
      />

      <Flate tittel="Konto" hva="Slik kjenner Verta deg igjen.">
        <Liste>
          <Rad hva="E-post" verdi={profile?.email ?? "—"} />
          <Rad hva="Plan" verdi={PLANS[plan].label} tone="gull" />
        </Liste>
      </Flate>

      {stripeEnabled && (
        <Flate
          tittel="Abonnement"
          hva="Betaling, kvitteringer og planbytte skjer hos Stripe."
        >
          <div className="flex flex-col gap-4">
            {abonnement === "mangler" && (
              <Beskjed tone="obs">
                Vi finner ingen aktiv Stripe-kunde på kontoen din, så det er
                ingen abonnement å administrere ennå. Planen din er trolig satt
                manuelt uten et Stripe-abonnement.
              </Beskjed>
            )}
            {abonnement === "feil" && (
              <Beskjed tone="kritisk">
                Kunne ikke åpne abonnementsportalen. I live-modus må Stripe
                Customer Portal aktiveres først (Stripe → Innstillinger →
                Betaling → Kundeportal → Aktiver).
              </Beskjed>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <form action={openBillingPortal}>
                <Handling type="submit" vekt="stille">
                  Administrer abonnement
                </Handling>
              </form>
              {plan === "premium" && (
                <form action={purchaseExtraProperty}>
                  <Handling type="submit" vekt="gull">
                    Kjøp ekstra eiendom
                  </Handling>
                </form>
              )}
            </div>
            {plan === "premium" && (
              <p className="text-xs text-hus-svak">
                {formatNok(EXTRA_PROPERTY_PRICE_NOK)}/mnd — eller{" "}
                {formatNok(EXTRA_PROPERTY_YEARLY_PRICE_NOK)}/år hvis du har
                årsplan.
              </p>
            )}
          </div>
        </Flate>
      )}

      {stripeEnabled && (
        <Flate
          tittel="Utbetaling for utleie"
          hva="Gjestene betaler deg direkte. Verta tar ingen provisjon på leien."
        >
          <div className="flex flex-col gap-4">
            {utbetaling === "klar" && (
              <Beskjed>
                Utbetaling er nå aktivert. Gjester kan betale bookinger direkte
                til deg.
              </Beskjed>
            )}
            {utbetaling === "ufullstendig" && (
              <Beskjed tone="obs">
                Oppsettet er ikke ferdig ennå. Fullfør registreringen hos Stripe
                for å kunne motta betaling.
              </Beskjed>
            )}
            {utbetaling === "feil" && (
              <Beskjed tone="kritisk">
                Noe gikk galt da vi prøvde å koble utbetaling. Prøv igjen.
                Vedvarer det, er Stripe Connect trolig ikke ferdig aktivert i
                live-modus ennå (fullfør plattformprofilen i Stripe).
              </Beskjed>
            )}
            {utbetaling === "gebyr" && (
              <Beskjed tone="obs">
                Du må huke av bekreftelsen om kortgebyr før du kan koble
                utbetaling.
              </Beskjed>
            )}

            {payoutsReady ? (
              <>
                <p className="text-sm leading-relaxed text-hus-dempet">
                  Status: <span className="text-hus-god">Aktiv</span> — gjestene
                  betaler <strong className="font-medium text-hus-blekk">
                    deg direkte
                  </strong>
                  . Verta tar ingen provisjon på leien. Kortgebyr fra Stripe
                  (~2–3 %) trekkes av dine utbetalinger — du ser brutto →
                  kortgebyr → netto per betaling i Stripe-dashbordet.
                </p>
                <div>
                  <form action={openConnectDashboard}>
                    <Handling type="submit" vekt="stille">
                      Åpne Stripe-dashbordet
                    </Handling>
                  </form>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-hus-dempet">
                  Koble til din egen Stripe-konto, så betaler gjestene deg{" "}
                  <strong className="font-medium text-hus-blekk">direkte</strong>{" "}
                  når de booker. Du er selger, Verta tar{" "}
                  <strong className="font-medium text-hus-blekk">
                    0 % av leien
                  </strong>
                  . Kortgebyret (~2–3 %) fra Stripe trekkes av dine utbetalinger.
                </p>
                <form
                  action={startConnectOnboarding}
                  className="flex flex-col items-start gap-4"
                >
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-hus-dempet">
                    <input
                      type="checkbox"
                      name="gebyr"
                      required
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-hus-gull)]"
                    />
                    <span>
                      Jeg forstår at kortgebyr (~2–3 %) belastes min
                      Stripe-konto, og at Verta ikke tar provisjon på leien.
                    </span>
                  </label>
                  <Handling type="submit" vekt="gull">
                    {hasConnect ? "Fullfør oppsett" : "Koble utbetaling"}
                  </Handling>
                </form>
              </>
            )}
          </div>
        </Flate>
      )}

      <Flate
        tittel="Personvern"
        hva="Dataene dine er dine. Last dem ned når du vil."
      >
        <div className="flex flex-col gap-4">
          <div>
            <Handling href="/api/gdpr/export" vekt="stille" nyFane>
              Last ned mine data (JSON)
            </Handling>
          </div>
          <p className="text-sm text-hus-svak">
            Se også{" "}
            <Link href="/personvern" className="text-hus-dempet underline">
              personvernerklæringen
            </Link>
            ,{" "}
            <Link
              href="/databehandleravtale"
              className="text-hus-dempet underline"
            >
              databehandleravtalen
            </Link>{" "}
            og{" "}
            <Link href="/vilkar" className="text-hus-dempet underline">
              vilkårene
            </Link>
            .
          </p>
        </div>
      </Flate>

      <Flate
        tittel="Faresone"
        hva="Sletting fjerner kontoen din og alle tilknyttede data permanent."
      >
        <DeleteAccountButton />
      </Flate>
    </Side>
  );
}

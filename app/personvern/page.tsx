import Link from "next/link";

import { LegalLayout, H2 } from "@/components/legal/legal-layout";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Personvernerklæring — Verta",
};

export default function PersonvernPage() {
  return (
    <LegalLayout title="Personvernerklæring">
      <p>
        {COMPANY.legalName} (org.nr. {COMPANY.orgNr}) er behandlingsansvarlig for
        personopplysninger vi behandler om deg som bruker av Verta, i samsvar med
        personvernforordningen (GDPR) og personopplysningsloven. Denne erklæringen
        beskriver hvilke opplysninger vi behandler, hvorfor, og hvilke rettigheter
        du har.
      </p>

      <H2>Hvilke opplysninger vi behandler</H2>
      <ul className="ml-5 list-disc">
        <li>
          <strong>Kontoinformasjon:</strong> navn, e-post, telefon og adresse.
        </li>
        <li>
          <strong>Eiendoms- og bookingdata:</strong> eiendommene dine, bookinger,
          gjesteopplysninger du legger inn, priser og kalender.
        </li>
        <li>
          <strong>Økonomi:</strong> utgifter, provisjoner og skatterelaterte
          beregninger. Betalingsdetaljer håndteres av Stripe/Vipps — vi lagrer
          ikke kortnummer.
        </li>
        <li>
          <strong>Bruksdata:</strong> innlogging, hendelseslogg og — dersom du
          samtykker — analyse via informasjonskapsler.
        </li>
      </ul>
      <p>
        Vi lagrer <strong>ikke fødselsnummer</strong>. Logger du inn med Vipps,
        bruker vi kun en ugjennomsiktig Vipps-id, ikke fødselsnummeret ditt.
      </p>

      <H2>Hvorfor vi behandler dem (behandlingsgrunnlag)</H2>
      <ul className="ml-5 list-disc">
        <li>
          <strong>Oppfylle avtalen</strong> med deg om å levere tjenesten (art. 6
          nr. 1 b).
        </li>
        <li>
          <strong>Rettslig forpliktelse</strong>, f.eks. bokførings- og
          skatteregler (art. 6 nr. 1 c).
        </li>
        <li>
          <strong>Berettiget interesse</strong> i å drifte, sikre og forbedre
          tjenesten (art. 6 nr. 1 f).
        </li>
        <li>
          <strong>Samtykke</strong> for valgfrie analyse-informasjonskapsler (art.
          6 nr. 1 a), som du når som helst kan trekke tilbake.
        </li>
      </ul>

      <H2>Hvor lenge vi lagrer</H2>
      <p>
        Vi lagrer opplysningene så lenge du har en aktiv konto. Sletter du kontoen,
        fjernes personopplysningene dine, med unntak av det vi er lovpålagt å
        beholde (f.eks. bokføringsmateriale i inntil fem år).
      </p>

      <H2>Databehandlere og deling</H2>
      <p>
        Vi selger aldri opplysningene dine. For å levere tjenesten bruker vi noen
        underleverandører (databehandlere) som behandler data på våre vegne. Se
        den fullstendige listen i vår{" "}
        <Link href="/databehandleravtale" className="underline">
          databehandleravtale
        </Link>
        . Overføringer utenfor EØS er sikret med EUs standardavtaler (SCC).
      </p>

      <H2>Kunstig intelligens (AI)</H2>
      <p>
        Verta bruker AI til enkelte funksjoner — blant annet chat-assistenten
        «Vera», forslag til svar på gjestemeldinger, prisanbefalinger og
        markedsføringstekst. For å levere disse sendes den aktuelle teksten til vår
        AI-leverandør <strong>Anthropic</strong> (Claude), som behandler den i USA
        under EUs standardavtaler (SCC). Anthropic bruker ikke dataene til å trene
        modeller. Chat-samtaler lagres ikke hos Verta. Vi oppfordrer deg til ikke å
        skrive inn sensitive personopplysninger i chat-assistenten.
      </p>

      <H2>Dine rettigheter</H2>
      <p>
        Du har rett til innsyn, retting, sletting, begrensning og dataportabilitet,
        og til å protestere mot behandling. Du kan når som helst laste ned alle
        dine data eller slette kontoen din under{" "}
        <Link href="/dashboard/settings" className="underline">
          Innstillinger
        </Link>{" "}
        i dashbordet.
      </p>

      <H2>Informasjonskapsler</H2>
      <p>
        Vi bruker nødvendige informasjonskapsler for innlogging, og valgfrie for
        analyse dersom du samtykker. Du styrer samtykket via samtykkebanneret.
      </p>

      <H2>Kontakt og klage</H2>
      <p>
        Spørsmål om personvern? Kontakt oss på{" "}
        <a href={`mailto:${COMPANY.privacyEmail}`} className="underline">
          {COMPANY.privacyEmail}
        </a>
        . Du har også rett til å klage til{" "}
        <a
          href="https://www.datatilsynet.no"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Datatilsynet
        </a>
        .
      </p>
    </LegalLayout>
  );
}

import Link from "next/link";

import { LegalLayout, H2 } from "@/components/legal/legal-layout";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Vilkår for bruk — Verta",
};

export default function VilkarPage() {
  return (
    <LegalLayout title="Vilkår for bruk">
      <p>
        Disse vilkårene gjelder mellom deg som bruker og {COMPANY.legalName}{" "}
        (org.nr. {COMPANY.orgNr}) ved bruk av Verta. Ved å opprette en konto
        aksepterer du vilkårene.
      </p>

      <H2>1. Tjenesten</H2>
      <p>
        Verta er et verktøy for å forvalte korttidsutleie: kalender og bookinger,
        gjestekommunikasjon, rengjøring og vedlikehold, markedsføring, smartlås og
        skatterapportering. Vi utvikler tjenesten løpende og kan endre eller
        avvikle funksjoner.
      </p>

      <H2>2. Konto</H2>
      <p>
        Du er ansvarlig for opplysningene du registrerer og for å holde
        innloggingen din sikker. Du må være myndig og ha rett til å forvalte
        eiendommene du legger inn. Du er selv ansvarlig for innholdet du laster opp
        og for at du har grunnlag til å behandle gjestenes opplysninger.
      </p>

      <H2>3. Abonnement og betaling</H2>
      <p>
        Verta tilbys mot en månedlig abonnementsavgift per plan. Avgiften belastes
        forskuddsvis via Stripe eller Vipps. Abonnementet løper til det sies opp og
        kan avsluttes når som helst med virkning fra inneværende periodes slutt.
        Tilleggstjenester (f.eks. ekstra eiendommer, betalt boost eller formidling
        av vaskehjelp) prises som oppgitt i tjenesten.
      </p>

      <H2>4. Vertas rolle</H2>
      <p>
        Verta er et verktøy, ikke part i avtalen mellom deg og dine gjester,
        vaskere eller håndverkere. Verta formidler i noen tilfeller kontakt (f.eks.
        vaskemarkedet), men ansvaret for selve utførelsen og oppgjøret ligger
        mellom partene. For behandling av personopplysninger på dine vegne gjelder{" "}
        <Link href="/databehandleravtale" className="underline">
          databehandleravtalen
        </Link>
        .
      </p>

      <H2>5. Akseptabel bruk</H2>
      <p>
        Du skal ikke bruke Verta til ulovlig virksomhet, forsøke å bryte sikkerhet,
        eller laste opp innhold du ikke har rett til. Vi kan stenge kontoer som
        misbruker tjenesten.
      </p>

      <H2>6. Ansvarsbegrensning</H2>
      <p>
        Tjenesten leveres «som den er». Skatteberegninger og AI-forslag er
        veiledende — du er selv ansvarlig for å kontrollere tall før innsending til
        myndigheter. Så langt loven tillater, er Vertas samlede ansvar begrenset til
        abonnementsavgiften for de siste tolv månedene, og vi er ikke ansvarlige for
        indirekte tap.
      </p>

      <H2>7. Oppsigelse</H2>
      <p>
        Du kan når som helst si opp ved å slette kontoen under{" "}
        <Link href="/dashboard/settings" className="underline">
          Innstillinger
        </Link>
        . Vi kan si opp eller begrense tilgangen ved vesentlig brudd på vilkårene.
      </p>

      <H2>8. Endringer og lovvalg</H2>
      <p>
        Vi kan oppdatere vilkårene; vesentlige endringer varsles. Vilkårene reguleres
        av norsk rett, med verneting i Norge.
      </p>

      <H2>9. Kontakt</H2>
      <p>
        Spørsmål? Kontakt oss på{" "}
        <a href={`mailto:${COMPANY.contactEmail}`} className="underline">
          {COMPANY.contactEmail}
        </a>
        .
      </p>
    </LegalLayout>
  );
}

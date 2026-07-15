import Link from "next/link";

import { LegalLayout, H2 } from "@/components/legal/legal-layout";
import { COMPANY } from "@/lib/company";

// JURIDISK: Denne teksten er oppdatert til direktebooking-modellen (utleieren er
// selger og betalingsmottaker; Verta er plattform/formidler, ikke part i
// leieavtalen). Bør gjennomgås av jurist før endelig lansering.

export const metadata = {
  title: "Salgsvilkår — Verta",
};

export default function SalgsvilkarPage() {
  return (
    <LegalLayout title="Salgsvilkår">
      <p>
        Disse salgsvilkårene gjelder når du som gjest bestiller et opphold via
        Verta. <strong>Avtalen om oppholdet inngås direkte mellom deg og
        utleieren</strong> av den enkelte eiendommen, som er selger og
        betalingsmottaker. Utleierens navn og kontaktinformasjon vises på
        bookingsiden. Verta ({COMPANY.legalName}, org.nr. {COMPANY.orgNr})
        leverer plattformen og formidler bestillingen, men er ikke part i
        leieavtalen og mottar ikke betaling for oppholdet.
      </p>

      <H2>1. Priser</H2>
      <p>
        Alle priser oppgis i norske kroner (NOK) og inkluderer offentlige avgifter.
        Totalprisen — inkludert eventuelt rengjøringsgebyr — vises som egne linjer
        før du bekrefter bestillingen. <strong>Det tilkommer ingen
        plattformgebyr:</strong> du betaler utleierens pris direkte. Ingen skjulte
        kostnader utover det som er spesifisert ved bestilling.
      </p>

      <H2>2. Betaling</H2>
      <p>
        Du betaler med betalingskort <strong>direkte til utleieren</strong> via
        vår betalingsleverandør Stripe. Betalingen belastes ved bestilling, med
        mindre annet er oppgitt for den enkelte eiendommen. Bestillingen er
        bindende når betalingen er gjennomført, og du mottar en bekreftelse på
        e-post. Kortopplysningene håndteres av Stripe — verken Verta eller
        utleieren lagrer kortnummeret ditt.
      </p>

      <H2>3. Angrerett</H2>
      <p>
        Angrerettloven gir normalt 14 dagers angrerett ved kjøp på nett. For
        avtaler om <strong>innkvartering på en bestemt dato eller for et bestemt
        tidsrom</strong> gjelder det et unntak (angrerettloven § 22 bokstav l), og
        det er derfor <strong>ikke</strong> angrerett på bestilling av opphold. I
        stedet gjelder utleierens avbestillingsvilkår, se punkt 4.
      </p>

      <H2>4. Avbestilling og refusjon</H2>
      <p>
        Avbestillingsvilkårene for det enkelte oppholdet vises ved bestilling og
        utgjør en del av avtalen med utleieren. Med mindre annet er oppgitt for
        eiendommen, gjelder følgende standardvilkår:
      </p>
      <ul className="ml-5 list-disc">
        <li>
          Avbestilling <strong>senest 14 dager før innsjekk</strong>: full
          refusjon.
        </li>
        <li>
          Avbestilling <strong>7–14 dager før innsjekk</strong>: 50 % refusjon.
        </li>
        <li>
          Avbestilling <strong>mindre enn 7 dager før innsjekk</strong>, eller
          uteblivelse: ingen refusjon.
        </li>
      </ul>
      <p>
        Avbestilling gjøres fra gjestesiden din eller ved å kontakte utleieren.
        Refusjon skjer fra utleieren til samme betalingsmiddel som ble brukt,
        normalt innen 14 dager. Blir oppholdet avlyst av utleieren, får du alltid
        full refusjon.
      </p>

      <H2>5. Mangler og reklamasjon</H2>
      <p>
        Har oppholdet en mangel i forhold til det som er beskrevet, kan du
        reklamere til utleieren. Ta kontakt så raskt som mulig — helst under
        oppholdet — så forholdet kan rettes. Krav om prisavslag eller erstatning
        behandles i samsvar med gjeldende forbrukerlovgivning.
      </p>

      <H2>6. Klagehåndtering</H2>
      <p>
        Klager rettes først til utleieren. Trenger du hjelp med selve plattformen,
        kontakt Verta på{" "}
        <a href={`mailto:${COMPANY.contactEmail}`} className="underline">
          {COMPANY.contactEmail}
        </a>
        . Kommer du og utleieren ikke til enighet, kan du bringe saken inn for{" "}
        <a
          href="https://www.forbrukertilsynet.no"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Forbrukertilsynet
        </a>{" "}
        eller Forbrukerrådet. Du kan også bruke EU-kommisjonens{" "}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          nettbaserte klageportal (ODR)
        </a>
        .
      </p>

      <H2>7. Selger og plattform</H2>
      <p>
        <strong>Selger</strong> er utleieren av den enkelte eiendommen (navn og
        kontaktinfo vises på bookingsiden). <strong>Plattform</strong> er{" "}
        {COMPANY.legalName}, org.nr. {COMPANY.orgNr}, {COMPANY.address} — kontakt{" "}
        <a href={`mailto:${COMPANY.contactEmail}`} className="underline">
          {COMPANY.contactEmail}
        </a>
        . Se også våre{" "}
        <Link href="/vilkar" className="underline">
          vilkår for bruk
        </Link>{" "}
        og{" "}
        <Link href="/personvern" className="underline">
          personvernerklæring
        </Link>
        . Avtalen reguleres av norsk rett.
      </p>
    </LegalLayout>
  );
}

import Link from "next/link";

import { LegalLayout, H2 } from "@/components/legal/legal-layout";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Salgsvilkår — Verta",
};

export default function SalgsvilkarPage() {
  return (
    <LegalLayout title="Salgsvilkår">
      <p>
        Disse salgsvilkårene gjelder når du som gjest bestiller og betaler for et
        opphold gjennom Verta. Betalingen håndteres av {COMPANY.legalName}{" "}
        (org.nr. {COMPANY.orgNr}) på vegne av utleieren av eiendommen. Selve
        leieavtalen om oppholdet inngås mellom deg og utleieren; Verta formidler
        bestillingen og gjennomfører betalingen.
      </p>

      <H2>1. Priser</H2>
      <p>
        Alle priser oppgis i norske kroner (NOK) og inkluderer offentlige avgifter.
        Totalprisen for oppholdet — inkludert eventuelle gebyrer for rengjøring
        eller forbruk — vises tydelig før du bekrefter bestillingen. Det tilkommer
        ingen skjulte kostnader utover det som er spesifisert ved bestilling.
      </p>

      <H2>2. Betaling</H2>
      <p>
        Du kan betale med Vipps eller betalingskort. Betalingen belastes ved
        bestilling, med mindre annet er oppgitt for den enkelte eiendommen.
        Bestillingen er bindende når betalingen er gjennomført, og du mottar en
        bekreftelse på e-post. Betalingsopplysningene dine håndteres av vår
        betalingsleverandør (Vipps MobilePay / Stripe) — Verta lagrer ikke
        kortnummeret ditt.
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
        utgjør en del av avtalen. Med mindre annet er oppgitt for eiendommen,
        gjelder følgende standardvilkår:
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
        Avbestilling gjøres ved å kontakte oss på{" "}
        <a href={`mailto:${COMPANY.contactEmail}`} className="underline">
          {COMPANY.contactEmail}
        </a>
        . Refusjon skjer til samme betalingsmiddel som ble brukt ved kjøpet,
        normalt innen 14 dager. Blir oppholdet avlyst av utleieren, får du alltid
        full refusjon.
      </p>

      <H2>5. Mangler og reklamasjon</H2>
      <p>
        Har oppholdet en mangel i forhold til det som er beskrevet, kan du
        reklamere. Ta kontakt så raskt som mulig — helst under oppholdet — så vi
        kan forsøke å rette forholdet. Krav om prisavslag eller erstatning
        behandles i samsvar med gjeldende forbrukerlovgivning.
      </p>

      <H2>6. Klagehåndtering</H2>
      <p>
        Klager rettes til{" "}
        <a href={`mailto:${COMPANY.contactEmail}`} className="underline">
          {COMPANY.contactEmail}
        </a>
        . Vi svarer normalt innen få virkedager og forsøker alltid å finne en
        løsning. Kommer vi ikke til enighet, kan du bringe saken inn for{" "}
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

      <H2>7. Selger og kontakt</H2>
      <p>
        Betalingen håndteres av {COMPANY.legalName}, org.nr. {COMPANY.orgNr},{" "}
        {COMPANY.address}. Kontakt:{" "}
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

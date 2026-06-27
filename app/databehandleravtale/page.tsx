import { LegalLayout, H2 } from "@/components/legal/legal-layout";
import { COMPANY, SUBPROCESSORS } from "@/lib/company";

export const metadata = {
  title: "Databehandleravtale — Verta",
};

export default function DatabehandleravtalePage() {
  return (
    <LegalLayout title="Databehandleravtale">
      <p>
        Denne databehandleravtalen («Avtalen») regulerer {COMPANY.legalName}s
        («Databehandler», org.nr. {COMPANY.orgNr}) behandling av personopplysninger
        på vegne av deg som kunde («Behandlingsansvarlig») når du bruker Verta, jf.
        personvernforordningen (GDPR) artikkel 28. Avtalen inngås automatisk når du
        tar tjenesten i bruk, og utfyller{" "}
        <a href="/vilkar" className="underline">
          vilkårene for bruk
        </a>
        .
      </p>

      <H2>1. Roller</H2>
      <p>
        Når du legger inn opplysninger om dine gjester, vaskere og håndverkere, er
        du behandlingsansvarlig og bestemmer formål og midler. Verta er
        databehandler og behandler opplysningene kun etter dine instruksjoner og for
        å levere tjenesten.
      </p>

      <H2>2. Formål og type behandling</H2>
      <p>
        Verta behandler personopplysninger for å levere utleieforvaltning:
        bookinger, gjestekommunikasjon, adgang (smartlås), rengjøring/vedlikehold,
        markedsføring, betaling og skatterapportering.
      </p>

      <H2>3. Kategorier registrerte og opplysninger</H2>
      <ul className="ml-5 list-disc">
        <li>
          <strong>Gjester:</strong> navn, kontaktinfo, bookingdetaljer,
          meldinger.
        </li>
        <li>
          <strong>Vaskere og håndverkere:</strong> navn, kontaktinfo, oppdrag og
          eventuelle bilder av utført arbeid.
        </li>
        <li>
          <strong>Andre kontakter</strong> du selv velger å registrere.
        </li>
      </ul>
      <p>
        Behandlingen omfatter normalt ikke særlige kategorier av personopplysninger.
        Du skal ikke legge inn slike opplysninger i fritekstfelter.
      </p>

      <H2>4. Databehandlers plikter</H2>
      <ul className="ml-5 list-disc">
        <li>Behandle opplysninger kun etter dokumenterte instruksjoner fra deg.</li>
        <li>Sikre at personer med tilgang har taushetsplikt.</li>
        <li>
          Iverksette egnede tekniske og organisatoriske sikkerhetstiltak (art. 32),
          inkludert kryptering under overføring og lagring, tilgangsstyring (RLS) og
          revisjonslogg.
        </li>
        <li>Bistå deg med å oppfylle registrertes rettigheter.</li>
        <li>
          Bistå med sikkerhet, avviksvarsling og personvernkonsekvensvurderinger.
        </li>
        <li>
          Varsle deg uten ugrunnet opphold ved brudd på personopplysningssikkerheten.
        </li>
      </ul>

      <H2>5. Underdatabehandlere</H2>
      <p>
        Du gir Verta generell tillatelse til å bruke underdatabehandlere for å
        levere tjenesten. Vi pålegger dem tilsvarende forpliktelser som i denne
        avtalen, og varsler ved endringer slik at du kan protestere. Per i dag
        bruker vi:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-navy">
              <th className="py-2 pr-4 font-semibold">Leverandør</th>
              <th className="py-2 pr-4 font-semibold">Formål</th>
              <th className="py-2 font-semibold">Lagringssted</th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name} className="border-b border-hairline align-top">
                <td className="py-2 pr-4 font-medium">{s.name}</td>
                <td className="py-2 pr-4 text-ink/80">{s.purpose}</td>
                <td className="py-2 text-ink/80">{s.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>6. Overføring utenfor EØS</H2>
      <p>
        Der en underdatabehandler behandler opplysninger utenfor EØS, sikres
        overføringen med EU-kommisjonens standardavtaler (SCC) og nødvendige
        tilleggstiltak.
      </p>

      <H2>7. Sikkerhet ved brudd</H2>
      <p>
        Ved brudd på personopplysningssikkerheten varsler Verta deg uten ugrunnet
        opphold etter at vi ble kjent med bruddet, med tilstrekkelig informasjon til
        at du kan oppfylle din varslingsplikt overfor Datatilsynet og berørte.
      </p>

      <H2>8. Sletting og tilbakelevering</H2>
      <p>
        Ved opphør av avtalen sletter eller tilbakeleverer Verta personopplysningene
        etter ditt valg, med mindre lagring kreves av lov. Du kan også når som helst
        eksportere eller slette dataene dine fra dashbordet.
      </p>

      <H2>9. Revisjon</H2>
      <p>
        Verta gjør tilgjengelig informasjon som er nødvendig for å vise at pliktene
        i art. 28 oppfylles, og muliggjør og bidrar til revisjoner.
      </p>

      <H2>10. Varighet</H2>
      <p>
        Avtalen gjelder så lenge Verta behandler personopplysninger på dine vegne.
      </p>

      <p className="mt-4 rounded-lg bg-cloud p-4 text-sm text-ink/70">
        Spørsmål om denne avtalen? Kontakt{" "}
        <a href={`mailto:${COMPANY.privacyEmail}`} className="underline">
          {COMPANY.privacyEmail}
        </a>
        .
      </p>
    </LegalLayout>
  );
}

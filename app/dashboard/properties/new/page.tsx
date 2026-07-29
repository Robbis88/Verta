import { createProperty } from "../actions";
import { PropertyForm } from "@/components/properties/property-form";
import { Flate, Side, Situasjon } from "@/components/hus";

/**
 * Ny eiendom — modul 9. Kun presentasjon; skjemaet og createProperty er uendret.
 */
export default function NewPropertyPage() {
  return (
    <Side>
      <Situasjon
        merke="Eiendommer"
        tittel="Fortell Verta om boligen."
        under="Navn og adresse holder for å komme i gang. Resten kan du fylle ut etter hvert — gjesteguide, priser og regnskap bygges på det du legger inn her."
      />
      <Flate>
        <PropertyForm action={createProperty} submitLabel="Opprett eiendom" />
      </Flate>
    </Side>
  );
}

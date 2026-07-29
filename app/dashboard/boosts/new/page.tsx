import { createClient } from "@/lib/supabase/server";
import { BoostForm } from "@/components/boosts/boost-form";
import { Flate, Side, Situasjon, Tomt } from "@/components/hus";

/**
 * Ny boost — modul 7. Kun presentasjon; skjemaet er uendret.
 */
export default async function NewBoostPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id,name")
    .order("created_at", { ascending: true });
  const properties = (data ?? []) as { id: string; name: string }[];

  return (
    <Side>
      <Situasjon
        merke="Boost"
        tittel="Sett et budsjett — Verta skriver resten."
        under="Du velger bolig, beløp og datoer. Verta skriver annonseteksten, du godkjenner den før noe publiseres."
      />

      <Flate>
        {properties.length === 0 ? (
          <Tomt
            tittel="Du må ha minst én bolig først."
            hva="Boosten trenger noe å annonsere for — bilder, beliggenhet og pris hentes fra boligen."
            knappTekst="Legg til eiendom"
            knappHref="/dashboard/properties/new"
          />
        ) : (
          <BoostForm properties={properties} />
        )}
      </Flate>
    </Side>
  );
}

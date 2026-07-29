import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PricingTool } from "@/components/pricing/pricing-tool";
import {
  SeasonalRates,
  type PriceProperty,
  type Season,
} from "@/components/pricing/seasonal-rates";
import { Flate, Side, Situasjon, Tomt } from "@/components/hus";
import { formatNok } from "@/lib/utils";

/**
 * Prising — modul 3 i UI-refaktoren. Kun presentasjon; samme spørringer og
 * samme to verktøy.
 */
export default async function PrisingPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: props } = await supabase
    .from("properties")
    .select("id,name,base_nightly_rate,cleaning_fee")
    .order("name");
  const properties = (props ?? []) as PriceProperty[];

  const propertyIds = properties.map((p) => p.id);
  const { data: seasonData } = propertyIds.length
    ? await supabase
        .from("seasonal_rates")
        .select("id,property_id,name,date_from,date_to,nightly_rate")
        .in("property_id", propertyIds)
    : { data: [] };
  const seasons = (seasonData ?? []) as Season[];

  if (properties.length === 0) {
    return (
      <Side>
        <Situasjon
          merke="Prising"
          tittel="Du har ingen bolig å prise ennå."
          under="Legg inn boligen din først, så hjelper Verta deg med å finne riktig nattpris."
        />
        <Flate>
          <Tomt
            tittel="Ingen bolig registrert."
            hva="Uten pris kan ikke Verta regne ut bookingtotaler eller si hva tomme netter koster deg."
            knappTekst="Legg til bolig"
            knappHref="/dashboard/properties/new"
          />
        </Flate>
      </Side>
    );
  }

  const utenPris = properties.filter((p) => p.base_nightly_rate == null);
  const forste = properties[0];

  return (
    <Side>
      <Situasjon
        merke="Prising"
        tittel={
          utenPris.length > 0
            ? utenPris.length === properties.length
              ? "Du har ikke satt nattpris ennå."
              : `${utenPris.length} av boligene dine mangler nattpris.`
            : properties.length === 1 && forste.base_nightly_rate != null
              ? `${forste.name} koster ${formatNok(Number(forste.base_nightly_rate))} per natt.`
              : "Prisene dine er satt."
        }
        under={
          utenPris.length > 0
            ? "Uten pris kan ikke Verta regne ut totalen på nye bookinger — eller vise deg hva de tomme nettene er verdt."
            : "Sesongprisene overstyrer baseprisen i periodene du velger. Under kan du be Verta om et forslag."
        }
      />

      <Flate
        tittel="Faste priser og sesonger"
        hva="Sesongprisen gjelder foran baseprisen i datoene den dekker."
      >
        <SeasonalRates properties={properties} seasons={seasons} />
      </Flate>

      <Flate
        tittel="Spør Verta"
        hva="Forslag basert på beliggenhet, størrelse og belegget ditt de neste 90 dagene."
      >
        <PricingTool properties={properties} />
      </Flate>
    </Side>
  );
}

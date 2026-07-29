import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { propertyLimit, type Plan } from "@/lib/constants";
import {
  Flate,
  Handling,
  Liste,
  Rad,
  Side,
  Situasjon,
  Tomt,
} from "@/components/hus";

/**
 * Eiendommer — modul 9. Kun presentasjon; samme spørring og samme plangrense.
 */
export default async function PropertiesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: properties } = await supabase
    .from("properties")
    .select("id,name,address,max_guests,slug")
    .order("created_at", { ascending: true });

  const plan: Plan = profile?.plan ?? "gratis";
  const limit = propertyLimit(plan, profile?.extra_properties_count ?? 0);
  const count = properties?.length ?? 0;
  const canAdd = count < limit;

  return (
    <Side>
      <Situasjon
        merke="Eiendommer"
        tittel={
          count === 0
            ? "Ingen bolig lagt inn ennå."
            : count === 1
              ? "Du har én bolig i Verta."
              : `Du har ${count} boliger i Verta.`
        }
        under={`${count} av ${limit} plasser brukt på planen din.`}
        handling={
          canAdd ? (
            <Handling href="/dashboard/properties/new" vekt="gull">
              Legg til eiendom
            </Handling>
          ) : (
            <Handling href="/dashboard" vekt="stille">
              Oppgrader for flere
            </Handling>
          )
        }
      />

      <Flate>
        {count === 0 ? (
          <Tomt
            tittel="Ingen eiendommer ennå."
            hva="Legg inn boligen din, så bygger Verta gjesteguide, priser, oppgaver og regnskap rundt den."
            knappTekst="Legg til eiendom"
            knappHref="/dashboard/properties/new"
          />
        ) : (
          <Liste>
            {properties!.map((p) => (
              <Rad
                key={p.id}
                href={`/dashboard/properties/${p.id}`}
                hva={p.name}
                detalj={[
                  p.address || "Ingen adresse",
                  p.max_guests ? `${p.max_guests} gjester` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ))}
          </Liste>
        )}
      </Flate>
    </Side>
  );
}

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  addSupply,
  adjustSupply,
  refillSupply,
  deleteSupply,
} from "./actions";
import {
  Felt,
  Flate,
  Handling,
  Liste,
  Rad,
  Side,
  Situasjon,
  Tomt,
  Velg,
} from "@/components/hus";

/**
 * Lager — modul 3 i UI-refaktoren. Kun presentasjon; samme fire handlinger
 * (addSupply, adjustSupply, refillSupply, deleteSupply) med samme felter.
 *
 * Handlelista lå tidligere som et kort på linje med alt annet. Nå er den
 * situasjonen siden åpner med, fordi det er den eneste grunnen til å komme hit.
 */

type Supply = {
  id: string;
  property_id: string;
  name: string;
  current_qty: number;
  low_threshold: number;
  unit: string | null;
};

/** +/− på én vare. Egen liten form, som før. */
function Juster({ id, delta }: { id: string; delta: number }) {
  return (
    <form action={adjustSupply}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="delta" value={delta} />
      <Handling type="submit" vekt="stille" className="px-3 py-1.5">
        {delta > 0 ? "+" : "−"}
      </Handling>
    </form>
  );
}

export default async function LagerPage() {
  await requireUser();
  const supabase = await createClient();

  const { data: props } = await supabase
    .from("properties")
    .select("id,name")
    .order("name");
  const properties = (props ?? []) as { id: string; name: string }[];
  const nameById = new Map(properties.map((p) => [p.id, p.name]));
  const flereBoliger = properties.length > 1;

  const { data: supplyData } = await supabase
    .from("supplies")
    .select("id,property_id,name,current_qty,low_threshold,unit")
    .order("name");
  const supplies = (supplyData ?? []) as Supply[];

  const low = supplies.filter((s) => s.current_qty <= s.low_threshold);

  return (
    <Side>
      <Situasjon
        merke="Lager"
        tittel={
          supplies.length === 0
            ? "Du har ikke lagt inn noen forbruksvarer ennå."
            : low.length === 0
              ? "Alt er godt forsynt."
              : low.length === 1
                ? "Én vare må fylles opp."
                : `${low.length} varer må fylles opp.`
        }
        under={
          low.length > 0
            ? "Ta med lista neste gang du er innom — så slipper gjestene å oppdage at noe mangler."
            : "Verta sier fra her når noe nærmer seg tomt, så du kan handle før turen."
        }
      />

      {low.length > 0 && (
        <Flate
          tittel="Ta med deg"
          hva="Foreslått mengde fyller opp til det dobbelte av lavterskelen."
        >
          <Liste>
            {low.map((s) => {
              const buy = Math.max(1, s.low_threshold * 2 - s.current_qty);
              return (
                <Rad
                  key={s.id}
                  hva={s.name}
                  detalj={
                    flereBoliger ? (nameById.get(s.property_id) ?? undefined) : undefined
                  }
                  verdi={`kjøp ~${buy} ${s.unit ?? "stk"}`}
                  tone="obs"
                  handling={
                    <form action={refillSupply}>
                      <input type="hidden" name="id" value={s.id} />
                      <Handling type="submit" vekt="stille">
                        Fylt opp
                      </Handling>
                    </form>
                  }
                />
              );
            })}
          </Liste>
        </Flate>
      )}

      {properties.length === 0 ? (
        <Flate>
          <Tomt
            tittel="Ingen bolig registrert."
            hva="Forbruksvarer føres per bolig, så Verta vet hvor noe mangler."
            knappTekst="Legg til bolig"
            knappHref="/dashboard/properties/new"
          />
        </Flate>
      ) : (
        <Flate
          tittel="Ny vare"
          hva="Sett et lavt-nivå, så dukker varen opp i lista over når den nærmer seg."
        >
          <form action={addSupply} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Velg
                navn="property_id"
                merke="Eiendom"
                valg={properties.map((p) => ({ verdi: p.id, tekst: p.name }))}
              />
              <Felt
                navn="name"
                merke="Vare"
                required
                placeholder="F.eks. Toalettpapir"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Felt
                navn="current_qty"
                merke="Antall nå"
                type="number"
                min={0}
                defaultValue={0}
              />
              <Felt
                navn="low_threshold"
                merke="Lavt ved"
                type="number"
                min={0}
                defaultValue={1}
              />
              <Felt navn="unit" merke="Enhet" placeholder="stk" />
            </div>
            <div>
              <Handling type="submit" vekt="gull">
                Legg til varen
              </Handling>
            </div>
          </form>
        </Flate>
      )}

      <Flate tittel={`Beholdning (${supplies.length})`}>
        {supplies.length === 0 ? (
          <Tomt
            tittel="Ingen varer registrert."
            hva="Toalettpapir, kaffe, oppvasksåpe, ved — det gjestene bruker opp uten å si fra."
          />
        ) : (
          <Liste>
            {supplies.map((s) => {
              const lavt = s.current_qty <= s.low_threshold;
              return (
                <Rad
                  key={s.id}
                  hva={s.name}
                  detalj={[
                    flereBoliger ? nameById.get(s.property_id) : null,
                    `lavt ved ${s.low_threshold}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  handling={
                    <span className="flex items-center gap-2">
                      <Juster id={s.id} delta={-1} />
                      <span
                        className={`w-16 text-center text-sm tabular-nums ${
                          lavt ? "text-hus-obs" : "text-hus-blekk"
                        }`}
                      >
                        {s.current_qty} {s.unit ?? ""}
                      </span>
                      <Juster id={s.id} delta={1} />
                      <form action={deleteSupply}>
                        <input type="hidden" name="id" value={s.id} />
                        <Handling type="submit" vekt="naken">
                          Slett
                        </Handling>
                      </form>
                    </span>
                  }
                />
              );
            })}
          </Liste>
        )}
      </Flate>
    </Side>
  );
}

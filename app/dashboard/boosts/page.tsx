import { createClient } from "@/lib/supabase/server";
import { formatNok } from "@/lib/utils";
import {
  Flate,
  Handling,
  Liste,
  Merke,
  Rad,
  Side,
  Situasjon,
  Tomt,
} from "@/components/hus";

/**
 * Boost-kampanjer — modul 7. Kun presentasjon; samme spørringer.
 */

type BoostRow = {
  id: string;
  property_id: string;
  status: string;
  budget_nok: number;
  platform: string;
  created_at: string;
};

const STATUS_TEKST: Record<string, string> = {
  pending: "Venter på betaling",
  approved: "Aktiv",
};

const STATUS_TONE: Record<string, "ro" | "obs" | "god"> = {
  pending: "obs",
  approved: "god",
};

const PLATTFORM: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  both: "Instagram og Facebook",
};

export default async function BoostsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("boosts")
    .select("id,property_id,status,budget_nok,platform,created_at")
    .order("created_at", { ascending: false });
  const boosts = (data ?? []) as BoostRow[];

  const ids = [...new Set(boosts.map((b) => b.property_id))];
  const { data: props } = ids.length
    ? await supabase.from("properties").select("id,name").in("id", ids)
    : { data: [] };
  const nameById = new Map(
    ((props ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name]),
  );

  const venter = boosts.filter((b) => b.status === "pending").length;
  const brukt = boosts
    .filter((b) => b.status === "approved")
    .reduce((s, b) => s + Number(b.budget_nok), 0);

  return (
    <Side>
      <Situasjon
        merke="Boost"
        tittel={
          boosts.length === 0
            ? "Ingen kampanjer ennå."
            : venter > 0
              ? `${venter} kampanje${venter > 1 ? "r" : ""} venter på betaling.`
              : `Du har brukt ${formatNok(brukt)} på å nå flere gjester.`
        }
        under="Verta skriver annonseteksten og publiserer den på Instagram og Facebook. Du godkjenner og betaler før noe går ut."
        handling={
          <Handling href="/dashboard/boosts/new" vekt="gull">
            Ny boost
          </Handling>
        }
      />

      <Flate>
        {boosts.length === 0 ? (
          <Tomt
            tittel="Ingen kampanjer ennå."
            hva="En boost løfter boligen din foran folk som leter etter et sted akkurat nå."
            knappTekst="Lag din første boost"
            knappHref="/dashboard/boosts/new"
          />
        ) : (
          <Liste>
            {boosts.map((b) => (
              <Rad
                key={b.id}
                nar={b.created_at.slice(0, 10)}
                href={`/dashboard/boosts/${b.id}`}
                hva={
                  <span className="flex items-center gap-2">
                    <span className="truncate">
                      {nameById.get(b.property_id) ?? "Eiendom"}
                    </span>
                    <Merke tone={STATUS_TONE[b.status] ?? "ro"}>
                      {STATUS_TEKST[b.status] ?? b.status}
                    </Merke>
                  </span>
                }
                detalj={PLATTFORM[b.platform] ?? b.platform}
                verdi={formatNok(Number(b.budget_nok))}
                tone="gull"
              />
            ))}
          </Liste>
        )}
      </Flate>
    </Side>
  );
}

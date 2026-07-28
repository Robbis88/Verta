import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createRequest,
  updateRequest,
  deleteRequest,
  addContractor,
  deleteContractor,
} from "./actions";
import { formatNok } from "@/lib/utils";
import { Kopier } from "@/components/hus/kopier";
import {
  Felt,
  feltKlasse,
  Flate,
  Handling,
  Kort,
  Liste,
  Merke,
  Omrade,
  Rad,
  Side,
  Situasjon,
  Tomt,
  Velg,
} from "@/components/hus";

/**
 * Vedlikehold — modul 4 i UI-refaktoren. Kun presentasjon.
 *
 * Samme fem handlinger med samme felter: createRequest, updateRequest
 * (id/status/priority/contractor_id/cost), deleteRequest, addContractor,
 * deleteContractor. Koblingen «løst sak med kostnad → utgift i skatt» er
 * uendret, og nå sagt tydelig i situasjonen.
 */

type Request = {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: string | null;
  contractor_id: string | null;
  cost: number | null;
};

type Contractor = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  trade: string | null;
  access_token: string;
};

const STATUS = [
  { verdi: "open", tekst: "Åpen" },
  { verdi: "in_progress", tekst: "Pågår" },
  { verdi: "resolved", tekst: "Løst" },
  { verdi: "cancelled", tekst: "Avbrutt" },
];
const PRIORITY = [
  { verdi: "low", tekst: "Lav" },
  { verdi: "normal", tekst: "Normal" },
  { verdi: "high", tekst: "Høy" },
  { verdi: "urgent", tekst: "Haster" },
];
const PRIORITY_TONE: Record<string, "ro" | "obs" | "kritisk"> = {
  urgent: "kritisk",
  high: "obs",
  normal: "ro",
  low: "ro",
};

export default async function VedlikeholdPage() {
  await requireUser();
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { data: props } = await supabase
    .from("properties")
    .select("id,name")
    .order("name");
  const properties = (props ?? []) as { id: string; name: string }[];
  const nameById = new Map(properties.map((p) => [p.id, p.name]));
  const flereBoliger = properties.length > 1;

  const { data: contractorData } = await supabase
    .from("contractors")
    .select("id,name,email,phone,trade,access_token")
    .order("name");
  const contractors = (contractorData ?? []) as Contractor[];
  const contractorById = new Map(contractors.map((c) => [c.id, c.name]));

  const { data: reqData } = await supabase
    .from("maintenance_requests")
    .select(
      "id,property_id,title,description,status,priority,assignee,contractor_id,cost",
    )
    .order("created_at", { ascending: false });
  const requests = (reqData ?? []) as Request[];

  const apne = requests.filter(
    (r) => r.status === "open" || r.status === "in_progress",
  );
  const haster = apne.filter((r) => r.priority === "urgent");

  return (
    <Side>
      <Situasjon
        merke="Vedlikehold"
        tittel={
          requests.length === 0
            ? "Ingen saker på huset."
            : haster.length > 0
              ? `${haster.length} ${haster.length === 1 ? "sak haster" : "saker haster"}.`
              : apne.length > 0
                ? `${apne.length} ${apne.length === 1 ? "åpen sak" : "åpne saker"}.`
                : "Alt er løst."
        }
        under="Løser du en sak og fører kostnaden, blir den automatisk en fradragsberettiget utgift i skatterapporten. Du slipper å registrere den to ganger."
      />

      {properties.length === 0 ? (
        <Flate>
          <Tomt
            tittel="Ingen bolig registrert."
            hva="Saker føres per bolig, så Verta vet hva som hører hvor."
            knappTekst="Legg til bolig"
            knappHref="/dashboard/properties/new"
          />
        </Flate>
      ) : (
        <Flate tittel="Ny sak">
          <form action={createRequest} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Velg
                navn="property_id"
                merke="Eiendom"
                valg={properties.map((p) => ({ verdi: p.id, tekst: p.name }))}
              />
              <Velg
                navn="priority"
                merke="Prioritet"
                defaultValue="normal"
                valg={PRIORITY}
              />
            </div>
            <Felt
              navn="title"
              merke="Hva er galt?"
              required
              placeholder="F.eks. Lekkasje under kjøkkenvask"
            />
            <Omrade
              navn="description"
              merke="Beskrivelse (valgfritt)"
              rows={2}
            />
            <div>
              <Handling type="submit" vekt="gull">
                Opprett saken
              </Handling>
            </div>
          </form>
        </Flate>
      )}

      <Flate
        tittel={`Håndverkere (${contractors.length})`}
        hva="Portal-lenken lar dem se og oppdatere sakene du tildeler dem — uten innlogging."
      >
        <form action={addContractor} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Felt navn="name" merke="Navn" required />
            <Felt navn="trade" merke="Fag" placeholder="F.eks. rørlegger" />
            <Felt navn="email" merke="E-post" type="email" />
            <Felt navn="phone" merke="Telefon" />
          </div>
          <div>
            <Handling type="submit" vekt="stille">
              Legg til håndverker
            </Handling>
          </div>
        </form>

        {contractors.length > 0 && (
          <div className="mt-5 border-t border-hus-linje pt-2">
            <Liste>
              {contractors.map((c) => (
                <Rad
                  key={c.id}
                  hva={c.name}
                  detalj={[c.trade, c.phone, c.email].filter(Boolean).join(" · ")}
                  handling={
                    <span className="flex items-center gap-1">
                      <Kopier
                        tekst={`${site}/handverker/${c.access_token}`}
                        merke="Kopier portal-lenke"
                      />
                      <form action={deleteContractor}>
                        <input type="hidden" name="id" value={c.id} />
                        <Handling type="submit" vekt="naken">
                          Slett
                        </Handling>
                      </form>
                    </span>
                  }
                />
              ))}
            </Liste>
          </div>
        )}
      </Flate>

      <Flate tittel={`Saker (${requests.length})`}>
        {requests.length === 0 ? (
          <Tomt
            tittel="Ingen saker ennå."
            hva="Alt fra en løs dørhåndtak til en lekkasje. Fører du kostnaden, havner den i skatterapporten av seg selv."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <Kort key={r.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-hus-blekk">
                      {r.title}
                      <Merke tone={PRIORITY_TONE[r.priority] ?? "ro"}>
                        {PRIORITY.find((p) => p.verdi === r.priority)?.tekst ??
                          r.priority}
                      </Merke>
                    </p>
                    <p className="mt-1 text-xs text-hus-svak">
                      {[
                        flereBoliger ? nameById.get(r.property_id) : null,
                        r.contractor_id && contractorById.has(r.contractor_id)
                          ? contractorById.get(r.contractor_id)
                          : r.assignee,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {r.description && (
                      <p className="mt-2 text-sm leading-relaxed text-hus-dempet">
                        {r.description}
                      </p>
                    )}
                  </div>
                  <form action={deleteRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <Handling type="submit" vekt="naken">
                      Slett
                    </Handling>
                  </form>
                </div>

                <form
                  action={updateRequest}
                  className="mt-4 flex flex-wrap items-end gap-2 border-t border-hus-linje pt-4"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-hus-svak">
                      Status
                    </span>
                    <select
                      name="status"
                      defaultValue={r.status}
                      className={`${feltKlasse} h-9 w-auto cursor-pointer`}
                    >
                      {STATUS.map((s) => (
                        <option key={s.verdi} value={s.verdi} className="bg-hus-hev">
                          {s.tekst}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-hus-svak">
                      Prioritet
                    </span>
                    <select
                      name="priority"
                      defaultValue={r.priority}
                      className={`${feltKlasse} h-9 w-auto cursor-pointer`}
                    >
                      {PRIORITY.map((p) => (
                        <option key={p.verdi} value={p.verdi} className="bg-hus-hev">
                          {p.tekst}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-hus-svak">
                      Håndverker
                    </span>
                    <select
                      name="contractor_id"
                      defaultValue={r.contractor_id ?? ""}
                      className={`${feltKlasse} h-9 w-auto cursor-pointer`}
                    >
                      <option value="" className="bg-hus-hev">
                        Ikke tildelt
                      </option>
                      {contractors.map((c) => (
                        <option key={c.id} value={c.id} className="bg-hus-hev">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-hus-svak">
                      Kostnad (kr)
                    </span>
                    <input
                      name="cost"
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={r.cost ?? ""}
                      className={`${feltKlasse} h-9 w-32`}
                    />
                  </label>
                  <Handling type="submit" vekt="stille">
                    Lagre
                  </Handling>
                  {r.cost != null && r.status === "resolved" && (
                    <span className="text-xs text-hus-god">
                      → {formatNok(Number(r.cost))} ført i skatt
                    </span>
                  )}
                </form>
              </Kort>
            ))}
          </div>
        )}
      </Flate>
    </Side>
  );
}

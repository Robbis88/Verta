
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { haversineKm } from "@/lib/geo";
import { formatNok } from "@/lib/utils";
import {
  requestCleaner,
  cancelRequest,
  reviewCleaner,
  payServiceRequest,
  refundServiceRequest,
} from "./actions";
import {
  Beskjed,
  Felt,
  feltKlasse,
  Flate,
  Handling,
  Kort,
  Merke,
  Side,
  Situasjon,
  Tomt,
} from "@/components/hus";

type Prop = { id: string; name: string; lat: number | null; lng: number | null };
type Cleaner = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  hourly_rate: number | null;
  max_travel_km: number | null;
  lat: number | null;
  lng: number | null;
};

export default async function FinnVaskehjelpPage({
  searchParams,
}: {
  searchParams: Promise<{
    property?: string;
    betalt?: string;
    feil?: string;
    refundert?: string;
  }>;
}) {
  await requireUser();
  const { property: propParam, betalt, feil, refundert } = await searchParams;
  const supabase = await createClient();

  const { data: propData } = await supabase
    .from("properties")
    .select("id,name,lat,lng")
    .order("name");
  const properties = (propData ?? []) as Prop[];

  const selected =
    properties.find((p) => p.id === propParam) ?? properties[0] ?? null;

  // Finn ledige vaskere i hele markedet (på tvers av kontoer) via admin-klient.
  let matches: (Cleaner & { distance: number })[] = [];
  if (selected?.lat != null && selected.lng != null) {
    const admin = createAdminClient();
    const { data: cleanerData } = await admin
      .from("cleaners")
      .select("id,name,email,phone,bio,hourly_rate,max_travel_km,lat,lng")
      .eq("available_for_hire", true)
      .not("lat", "is", null);
    const cleaners = (cleanerData ?? []) as Cleaner[];
    const here = { lat: selected.lat, lng: selected.lng };
    matches = cleaners
      .filter((c) => c.lat != null && c.lng != null)
      .map((c) => ({
        ...c,
        distance: haversineKm(here, { lat: c.lat!, lng: c.lng! }),
      }))
      .filter((c) => c.max_travel_km == null || c.distance <= c.max_travel_km)
      .sort((a, b) => a.distance - b.distance);
  }

  // Mine sendte forespørsler (RLS gir kun egne) + oppslag av vasker-navn.
  const { data: reqData } = await supabase
    .from("service_requests")
    .select("id,cleaner_id,property_id,job_date,status,amount,verta_fee,payment_status,created_at")
    .order("created_at", { ascending: false });
  const myRequests = (reqData ?? []) as {
    id: string;
    cleaner_id: string;
    property_id: string;
    job_date: string | null;
    status: string;
    amount: number | null;
    verta_fee: number | null;
    payment_status: string;
  }[];
  const reqCleanerIds = [...new Set(myRequests.map((r) => r.cleaner_id))];
  const { data: reqCleaners } = reqCleanerIds.length
    ? await createAdminClient().from("cleaners").select("id,name").in("id", reqCleanerIds)
    : { data: [] };
  const cleanerNameById = new Map(
    ((reqCleaners ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
  );
  const propNameById = new Map(properties.map((p) => [p.id, p.name]));

  // Snitt-vurdering for de matchede vaskerne (leses via admin).
  const reviewStats = new Map<string, { avg: number; count: number }>();
  const matchIds = matches.map((m) => m.id);
  if (matchIds.length) {
    const { data: rev } = await createAdminClient()
      .from("cleaner_reviews")
      .select("cleaner_id,rating")
      .in("cleaner_id", matchIds);
    const acc = new Map<string, { sum: number; count: number }>();
    for (const r of (rev ?? []) as { cleaner_id: string; rating: number }[]) {
      const a = acc.get(r.cleaner_id) ?? { sum: 0, count: 0 };
      a.sum += r.rating;
      a.count += 1;
      acc.set(r.cleaner_id, a);
    }
    for (const [id, a] of acc) {
      reviewStats.set(id, {
        avg: Math.round((a.sum / a.count) * 10) / 10,
        count: a.count,
      });
    }
  }

  const REQ_STATUS: Record<string, string> = {
    pending: "Venter",
    accepted: "Godtatt",
    declined: "Avslått",
    cancelled: "Avbrutt",
  };

  const ventende = myRequests.filter((r) => r.status === "pending").length;

  return (
    <Side bred>
      <Situasjon
        merke="Finn vaskehjelp"
        tittel={
          properties.length === 0
            ? "Du har ingen bolig å finne hjelp til ennå."
            : matches.length === 0
              ? "Ingen ledige vaskere innen rekkevidde ennå."
              : `${matches.length} ${matches.length === 1 ? "vasker" : "vaskere"} kan ta oppdrag hos deg.`
        }
        under={
          ventende > 0
            ? `${ventende} av forespørslene dine venter fortsatt på svar.`
            : "Vaskere som har sagt at de tar oppdrag, og hvor langt de kjører. Dere avtaler pris selv; Verta tar 10 % først når du betaler gjennom oss."
        }
        handling={
          properties.length > 1 ? (
            <>
              {properties.map((p) => (
                <Handling
                  key={p.id}
                  href={`/dashboard/finn-vaskehjelp?property=${p.id}`}
                  vekt={selected?.id === p.id ? "gull" : "stille"}
                >
                  {p.name}
                </Handling>
              ))}
            </>
          ) : undefined
        }
      />

      {betalt && (
        <Beskjed>
          Betalingen er gjennomført. Vaskeren får beløpet minus Vertas 10 %.
        </Beskjed>
      )}
      {feil === "vasker" && (
        <Beskjed tone="obs">
          Vaskeren har ikke koblet utbetaling ennå, så oppdraget kan ikke betales
          gjennom Verta. Be vaskeren koble utbetaling i portalen sin.
        </Beskjed>
      )}
      {refundert && (
        <Beskjed>
          Oppdraget er refundert. Beløpet hentes tilbake fra vaskeren, og Vertas
          gebyr returneres.
        </Beskjed>
      )}
      {feil === "refusjon" && (
        <Beskjed tone="kritisk">
          Refusjonen kunne ikke gjennomføres. Prøv igjen, eller sjekk oppdraget i
          Stripe.
        </Beskjed>
      )}

      {properties.length === 0 ? (
        <Flate>
          <Tomt
            tittel="Ingen bolig registrert."
            hva="Verta finner vaskere ut fra hvor boligen din ligger."
            knappTekst="Legg til bolig"
            knappHref="/dashboard/properties/new"
          />
        </Flate>
      ) : selected && (selected.lat == null || selected.lng == null) ? (
        <Flate>
          <Tomt
            tittel={`«${selected.name}» mangler en gjenkjent adresse.`}
            hva="Legg inn adressen og lagre, så finner vi vaskere i nærheten."
            knappTekst="Rediger eiendommen"
            knappHref={`/dashboard/properties/${selected.id}`}
          />
        </Flate>
      ) : matches.length === 0 ? (
        <Flate>
          <Tomt
            tittel="Ingen ledige vaskere innen rekkevidde."
            hva="Markedet fylles opp etter hvert som flere vaskere gjør seg synlige. Prøv igjen om en stund."
          />
        </Flate>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((c) => {
            const stats = reviewStats.get(c.id);
            return (
              <Flate key={c.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-lg font-light text-hus-blekk">{c.name}</p>
                  <span className="shrink-0 text-sm text-hus-svak">
                    ~{c.distance} km
                  </span>
                </div>

                {stats && (
                  <p className="mt-2 text-sm text-hus-gull-lys">
                    ★ {stats.avg}{" "}
                    <span className="text-hus-svak">({stats.count})</span>
                  </p>
                )}
                {c.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-hus-dempet">
                    {c.bio}
                  </p>
                )}
                {c.hourly_rate != null && (
                  <p className="mt-2 text-sm text-hus-svak">
                    Timepris {formatNok(Number(c.hourly_rate))}
                  </p>
                )}

                {(c.phone || c.email) && (
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-hus-linje pt-3 text-sm">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="text-hus-gull underline underline-offset-4"
                      >
                        {c.phone}
                      </a>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="text-hus-gull underline underline-offset-4"
                      >
                        {c.email}
                      </a>
                    )}
                  </div>
                )}

                {selected && (
                  <form
                    action={requestCleaner}
                    className="mt-4 flex flex-col gap-3 border-t border-hus-linje pt-4"
                  >
                    <input type="hidden" name="cleaner_id" value={c.id} />
                    <input type="hidden" name="property_id" value={selected.id} />
                    <Felt navn="job_date" merke="Dato" type="date" />
                    <Felt
                      navn="amount"
                      merke="Avtalt pris (kr)"
                      type="number"
                      min={0}
                      placeholder="0"
                    />
                    <Felt
                      navn="message"
                      merke="Melding (valgfritt)"
                      placeholder="Kort om oppdraget"
                    />
                    <div>
                      <Handling type="submit" vekt="gull">
                        Send forespørsel
                      </Handling>
                    </div>
                  </form>
                )}
              </Flate>
            );
          })}
        </div>
      )}

      {myRequests.length > 0 && (
        <Flate
          tittel="Mine forespørsler"
          hva="Prisen er det dere avtaler. Verta tar 10 % først når du betaler gjennom oss."
        >
          <div className="flex flex-col gap-3">
            {myRequests.map((r) => (
              <Kort key={r.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-hus-blekk">
                      {cleanerNameById.get(r.cleaner_id) ?? "Vasker"}
                    </p>
                    <p className="text-xs text-hus-svak">
                      {[propNameById.get(r.property_id), r.job_date]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Merke
                      tone={
                        r.status === "accepted"
                          ? "god"
                          : r.status === "declined" || r.status === "cancelled"
                            ? "kritisk"
                            : "obs"
                      }
                    >
                      {REQ_STATUS[r.status] ?? r.status}
                    </Merke>
                    {r.status === "pending" && (
                      <form action={cancelRequest}>
                        <input type="hidden" name="id" value={r.id} />
                        <Handling type="submit" vekt="naken">
                          Avbryt
                        </Handling>
                      </form>
                    )}
                    {r.status === "accepted" && (
                      <form
                        action={reviewCleaner}
                        className="flex items-center gap-1"
                      >
                        <input type="hidden" name="cleaner_id" value={r.cleaner_id} />
                        <input type="hidden" name="property_id" value={r.property_id} />
                        <select
                          name="rating"
                          defaultValue="5"
                          aria-label="Vurdering"
                          className={`${feltKlasse} h-9 w-auto cursor-pointer`}
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n} className="bg-hus-hev">
                              {n}★
                            </option>
                          ))}
                        </select>
                        <input
                          name="comment"
                          placeholder="Kommentar"
                          className={`${feltKlasse} h-9 w-36`}
                        />
                        <Handling type="submit" vekt="naken">
                          Vurder
                        </Handling>
                      </form>
                    )}
                  </div>
                </div>

                {r.amount != null && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hus-linje pt-3 text-xs">
                    <span className="text-hus-svak">
                      Pris {formatNok(Number(r.amount))} · Verta-gebyr{" "}
                      {formatNok(Number(r.verta_fee ?? 0))} · til vasker{" "}
                      {formatNok(Number(r.amount) - Number(r.verta_fee ?? 0))}
                    </span>
                    {r.status === "accepted" &&
                      (r.payment_status === "paid" ? (
                        <span className="flex items-center gap-2">
                          <span className="text-hus-god">Betalt ✓</span>
                          <form action={refundServiceRequest}>
                            <input type="hidden" name="id" value={r.id} />
                            <Handling type="submit" vekt="naken">
                              Refunder
                            </Handling>
                          </form>
                        </span>
                      ) : r.payment_status === "refunded" ? (
                        <span className="text-hus-svak">Refundert</span>
                      ) : (
                        <form action={payServiceRequest}>
                          <input type="hidden" name="id" value={r.id} />
                          <Handling type="submit" vekt="gull">
                            Betal
                          </Handling>
                        </form>
                      ))}
                  </div>
                )}
              </Kort>
            ))}
          </div>
        </Flate>
      )}
    </Side>
  );
}

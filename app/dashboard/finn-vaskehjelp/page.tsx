import Link from "next/link";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Finn vaskehjelp</h1>
        <p className="text-sm text-muted-foreground">
          Ledige vaskere i nærheten av eiendommen din — som har sagt de tar
          oppdrag og kjører så langt.
        </p>
      </div>

      {betalt && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Betalingen er gjennomført. Vaskeren får beløpet minus Vertas 10 %.
        </p>
      )}
      {feil === "vasker" && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Vaskeren har ikke koblet utbetaling ennå, så oppdraget kan ikke betales
          gjennom Verta. Be vaskeren koble utbetaling i portalen sin.
        </p>
      )}
      {refundert && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Oppdraget er refundert. Beløpet hentes tilbake fra vaskeren, og Vertas
          gebyr returneres.
        </p>
      )}
      {feil === "refusjon" && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          Refusjonen kunne ikke gjennomføres. Prøv igjen, eller sjekk oppdraget i
          Stripe.
        </p>
      )}

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Legg til en eiendom først.{" "}
            <Link href="/dashboard/properties/new" className="underline">
              Legg til eiendom
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {properties.map((p) => (
              <Button
                key={p.id}
                asChild
                size="sm"
                variant={selected?.id === p.id ? "default" : "outline"}
              >
                <Link href={`/dashboard/finn-vaskehjelp?property=${p.id}`}>
                  {p.name}
                </Link>
              </Button>
            ))}
          </div>

          {selected && (selected.lat == null || selected.lng == null) ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                «{selected.name}» mangler en gjenkjent adresse. Legg inn adressen
                under{" "}
                <Link
                  href={`/dashboard/properties/${selected.id}`}
                  className="underline"
                >
                  Rediger eiendom
                </Link>{" "}
                og lagre, så finner vi vaskere i nærheten.
              </CardContent>
            </Card>
          ) : matches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Ingen ledige vaskere innen rekkevidde ennå. Det fylles opp
                etter hvert som flere blir synlige.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{c.name}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        ~{c.distance} km
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    {reviewStats.get(c.id) && (
                      <p className="text-gold">
                        ★ {reviewStats.get(c.id)!.avg}{" "}
                        <span className="text-muted-foreground">
                          ({reviewStats.get(c.id)!.count})
                        </span>
                      </p>
                    )}
                    {c.bio && <p className="text-ink">{c.bio}</p>}
                    {c.hourly_rate != null && (
                      <p className="text-muted-foreground">
                        Timepris: {formatNok(Number(c.hourly_rate))}
                      </p>
                    )}
                    <div className="flex flex-col gap-1 border-t pt-2">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="text-navy underline">
                          {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="text-navy underline"
                        >
                          {c.email}
                        </a>
                      )}
                    </div>
                    {selected && (
                      <form
                        action={requestCleaner}
                        className="flex flex-col gap-2 border-t pt-2"
                      >
                        <input type="hidden" name="cleaner_id" value={c.id} />
                        <input type="hidden" name="property_id" value={selected.id} />
                        <Input name="job_date" type="date" className="h-9" />
                        <Input
                          name="amount"
                          type="number"
                          min={0}
                          placeholder="Avtalt pris (kr)"
                          className="h-9"
                        />
                        <Input name="message" placeholder="Melding (valgfritt)" className="h-9" />
                        <Button type="submit" size="sm" variant="outline">
                          Send forespørsel
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {myRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mine forespørsler</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y">
                  {myRequests.map((r) => (
                    <li key={r.id} className="flex flex-col gap-2 py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                      <span className="flex-1">
                        {cleanerNameById.get(r.cleaner_id) ?? "Vasker"} ·{" "}
                        <span className="text-muted-foreground">
                          {propNameById.get(r.property_id) ?? "—"}
                          {r.job_date ? ` · ${r.job_date}` : ""}
                        </span>
                      </span>
                      <Badge>{REQ_STATUS[r.status] ?? r.status}</Badge>
                      {r.status === "pending" && (
                        <form action={cancelRequest}>
                          <input type="hidden" name="id" value={r.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Avbryt
                          </Button>
                        </form>
                      )}
                      {r.status === "accepted" && (
                        <form action={reviewCleaner} className="flex items-center gap-1">
                          <input type="hidden" name="cleaner_id" value={r.cleaner_id} />
                          <input type="hidden" name="property_id" value={r.property_id} />
                          <select
                            name="rating"
                            defaultValue="5"
                            className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                          >
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={n}>
                                {n}★
                              </option>
                            ))}
                          </select>
                          <Input name="comment" placeholder="Kommentar" className="h-8 w-28" />
                          <Button type="submit" variant="ghost" size="sm">
                            Vurder
                          </Button>
                        </form>
                      )}
                      </div>
                      {r.amount != null && (
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">
                            Pris {formatNok(Number(r.amount))} · Verta-gebyr{" "}
                            {formatNok(Number(r.verta_fee ?? 0))} · til vasker{" "}
                            {formatNok(Number(r.amount) - Number(r.verta_fee ?? 0))}
                          </span>
                          {r.status === "accepted" &&
                            (r.payment_status === "paid" ? (
                              <span className="flex items-center gap-3">
                                <span className="font-medium text-emerald-600">
                                  Betalt ✓
                                </span>
                                <form action={refundServiceRequest}>
                                  <input type="hidden" name="id" value={r.id} />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Refunder
                                  </Button>
                                </form>
                              </span>
                            ) : r.payment_status === "refunded" ? (
                              <span className="font-medium text-muted-foreground">
                                Refundert
                              </span>
                            ) : (
                              <form action={payServiceRequest}>
                                <input type="hidden" name="id" value={r.id} />
                                <Button type="submit" size="sm">
                                  Betal
                                </Button>
                              </form>
                            ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

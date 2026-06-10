import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { haversineKm } from "@/lib/geo";
import { formatNok } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  searchParams: Promise<{ property?: string }>;
}) {
  await requireUser();
  const { property: propParam } = await searchParams;
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Finn vaskehjelp</h1>
        <p className="text-sm text-muted-foreground">
          Ledige vaskere i nærheten av eiendommen din — som har sagt de tar
          oppdrag og kjører så langt.
        </p>
      </div>

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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { Search } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { PropertyCard, type Listing } from "@/components/public/property-card";

/**
 * Markedsplass-teaser på forsiden: søkefelt som fører til /hytter, og et utvalg
 * hytter. Serverkomponent — henter noen få eiendommer å vise fram.
 */
export async function ExploreStays() {
  let all: Listing[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("properties")
      .select("slug,name,address,images,base_nightly_rate,max_guests,bedrooms")
      .order("created_at", { ascending: false })
      .limit(12);
    all = (data ?? []) as Listing[];
  } catch {
    return null; // forsiden skal aldri feile på grunn av dette
  }
  // Vis helst dem med bilder først.
  const featured = [...all]
    .sort(
      (a, b) => (b.images?.length ? 1 : 0) - (a.images?.length ? 1 : 0),
    )
    .slice(0, 6);

  if (featured.length === 0) return null;

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Utforsk hyttene på Verta
          </h2>
          <p className="mt-4 text-lg text-ink">
            Søk blant hytter og feriehus over hele landet — og book direkte, uten
            gebyr.
          </p>

          <form
            method="get"
            action="/hytter"
            className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full border border-hairline bg-white p-1.5 shadow-sm"
          >
            <span className="pl-3 text-ink/40">
              <Search className="h-5 w-5" />
            </span>
            <input
              name="q"
              placeholder="Hvor vil du reise? (sted eller navn)"
              className="h-10 flex-1 bg-transparent px-2 text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark"
            >
              Søk
            </button>
          </form>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.slug} listing={p} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/hytter"
            className="inline-flex rounded-lg border border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white"
          >
            Se alle hytter
          </Link>
        </div>
      </div>
    </section>
  );
}

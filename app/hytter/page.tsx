import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { AMENITY_LABELS } from "@/lib/amenities";
import { PropertyCard, type Listing } from "@/components/public/property-card";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Finn hytter og feriehus",
  description:
    "Søk blant hytter og feriehus i Norge. Filtrer på pris, gjester og fasiliteter — og book direkte uten gebyr.",
  alternates: { canonical: "/hytter" },
};

type Row = Listing & { amenities: string[] | null; id: string };

const FILTER_AMENITIES = [
  "wifi",
  "peis",
  "boblebad",
  "badstue",
  "kjaeledyr",
  "barnevennlig",
  "lademulighet",
];

const inputClass =
  "h-10 rounded-lg border border-hairline bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/40";

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    guests?: string;
    maxpris?: string;
    fra?: string;
    til?: string;
    fasilitet?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const guests = Number(sp.guests) || 0;
  const maxpris = Number(sp.maxpris) || 0;
  const selectedAmenities = toArray(sp.fasilitet);

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select(
      "id,slug,name,address,images,base_nightly_rate,max_guests,bedrooms,amenities",
    )
    .order("created_at", { ascending: false });
  let list = (data ?? []) as Row[];

  // Tekst, gjester, pris, fasiliteter.
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter((p) =>
      `${p.name} ${p.address ?? ""}`.toLowerCase().includes(needle),
    );
  }
  if (guests > 0) list = list.filter((p) => (p.max_guests ?? 0) >= guests);
  if (maxpris > 0) {
    list = list.filter(
      (p) =>
        p.base_nightly_rate != null && Number(p.base_nightly_rate) <= maxpris,
    );
  }
  if (selectedAmenities.length > 0) {
    list = list.filter((p) => {
      const set = new Set(p.amenities ?? []);
      return selectedAmenities.every((a) => set.has(a));
    });
  }

  // Ledige datoer: fjern eiendommer med booking som overlapper [fra, til).
  if (sp.fra && sp.til && sp.til > sp.fra) {
    const { data: booked } = await supabase
      .from("bookings")
      .select("property_id")
      .not("status", "in", "(cancelled,requested)")
      .lt("check_in", sp.til)
      .gt("check_out", sp.fra);
    const bookedIds = new Set((booked ?? []).map((b) => b.property_id));
    list = list.filter((p) => !bookedIds.has(p.id));
  }

  return (
    <div className="min-h-screen bg-cloud">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight text-navy">
          Verta
        </Link>
        <Link href="/login" className="text-sm font-medium text-ink hover:text-navy">
          Logg inn
        </Link>
      </header>

      <section className="px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Finn din neste hytte
          </h1>
          <p className="mt-2 text-ink">
            Søk blant {list.length} {list.length === 1 ? "bolig" : "boliger"} og
            book direkte — uten gebyr.
          </p>

          {/* Filtre (GET-skjema, fungerer uten JS) */}
          <form
            method="get"
            className="mt-6 flex flex-col gap-4 rounded-2xl border border-hairline bg-white p-5 shadow-sm"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="relative sm:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Sted eller navn"
                  className={`${inputClass} w-full pl-9`}
                />
              </label>
              <input
                name="guests"
                type="number"
                min={1}
                defaultValue={guests || ""}
                placeholder="Gjester"
                className={inputClass}
              />
              <input
                name="maxpris"
                type="number"
                min={0}
                step={100}
                defaultValue={maxpris || ""}
                placeholder="Maks kr/natt"
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="fra"
                  type="date"
                  defaultValue={sp.fra ?? ""}
                  className={inputClass}
                  aria-label="Fra dato"
                />
                <input
                  name="til"
                  type="date"
                  defaultValue={sp.til ?? ""}
                  className={inputClass}
                  aria-label="Til dato"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {FILTER_AMENITIES.map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    name="fasilitet"
                    value={key}
                    defaultChecked={selectedAmenities.includes(key)}
                    className="h-4 w-4"
                  />
                  {AMENITY_LABELS[key] ?? key}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark"
              >
                Søk
              </button>
              <Link
                href="/hytter"
                className="text-sm text-ink/60 hover:text-navy"
              >
                Nullstill
              </Link>
            </div>
          </form>
        </div>
      </section>

      <main className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-hairline bg-white p-12 text-center text-ink/60">
              Ingen boliger matchet søket. Prøv å justere filtrene.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <PropertyCard key={p.slug} listing={p} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

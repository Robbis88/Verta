import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createDirectBooking } from "./actions";
import { BookingForm } from "@/components/booking/booking-form";

type PublicProperty = {
  name: string;
  description: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  max_guests: number | null;
};

// Henter kun offentlig-trygge felter via admin-klienten (omgår RLS).
async function getProperty(slug: string): Promise<PublicProperty | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select("name,description,address,bedrooms,bathrooms,max_guests")
    .eq("slug", slug)
    .single();
  return (data as PublicProperty) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  return { title: property ? `${property.name} — Verta` : "Verta" };
}

export default async function PublicPropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) notFound();

  const specs = [
    property.bedrooms != null ? `${property.bedrooms} soverom` : null,
    property.bathrooms != null ? `${property.bathrooms} bad` : null,
    property.max_guests != null ? `${property.max_guests} gjester` : null,
  ].filter(Boolean);

  return (
    <main className="mx-auto grid max-w-5xl gap-12 p-6 py-12 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-navy">
          {property.name}
        </h1>
        {property.address && (
          <p className="text-ink">{property.address}</p>
        )}
        {specs.length > 0 && (
          <p className="text-sm font-medium text-ink">{specs.join(" · ")}</p>
        )}
        {property.description && (
          <p className="leading-relaxed text-ink">{property.description}</p>
        )}
      </div>

      <div className="rounded-xl border border-hairline p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-navy">Book direkte</h2>
        <BookingForm action={createDirectBooking.bind(null, slug)} />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createDirectBooking, quoteBooking } from "./actions";
import { BookingForm } from "@/components/booking/booking-form";
import { AvailabilityCalendar } from "@/components/calendar/availability-calendar";
import { bookedDateSet } from "@/lib/availability";
import { CANCELLATION_POLICY_LINES } from "@/lib/cancellation";
import { formatNok } from "@/lib/utils";

type PublicProperty = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  max_guests: number | null;
  base_nightly_rate: number | null;
  cleaning_fee: number | null;
  booking_mode: "instant" | "request";
  images: string[] | null;
};

// Henter kun offentlig-trygge felter via admin-klienten (omgår RLS).
async function getProperty(slug: string): Promise<PublicProperty | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select(
      "id,name,description,address,bedrooms,bathrooms,max_guests,base_nightly_rate,cleaning_fee,booking_mode,images",
    )
    .eq("slug", slug)
    .single();
  return (data as PublicProperty) ?? null;
}

async function getBookedDates(propertyId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("bookings")
    .select("check_in,check_out,status")
    .eq("property_id", propertyId)
    .neq("status", "cancelled");
  return [...bookedDateSet(data ?? [])];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return {};

  const description =
    property.description?.slice(0, 160) ??
    `Book ${property.name} direkte — se ledige datoer og bestill uten gebyr.`;

  return {
    title: property.name,
    description,
    openGraph: {
      title: `${property.name} — Verta`,
      description,
      type: "website",
      images: property.images?.[0] ? [property.images[0]] : undefined,
    },
  };
}

export default async function PublicPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ kilde?: string; betalt?: string; avbrutt?: string }>;
}) {
  const { slug } = await params;
  const { kilde, betalt, avbrutt } = await searchParams;
  const property = await getProperty(slug);
  if (!property) notFound();

  const bookedDates = await getBookedDates(property.id);
  const today = new Date().toISOString().slice(0, 10);

  const specs = [
    property.bedrooms != null ? `${property.bedrooms} soverom` : null,
    property.bathrooms != null ? `${property.bathrooms} bad` : null,
    property.max_guests != null ? `${property.max_guests} gjester` : null,
  ].filter(Boolean);

  const images = property.images ?? [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 p-6 py-12">
      {images.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt={property.name}
            className="aspect-[4/3] w-full rounded-xl object-cover sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:h-full"
          />
          {images.slice(1, 5).map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={property.name}
              className="hidden aspect-[4/3] w-full rounded-lg object-cover sm:block"
            />
          ))}
        </div>
      )}

      <div className="grid gap-12 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            {property.name}
          </h1>
          {property.address && <p className="text-ink">{property.address}</p>}
          {specs.length > 0 && (
            <p className="text-sm font-medium text-ink">{specs.join(" · ")}</p>
          )}
          {property.description && (
            <p className="leading-relaxed text-ink">{property.description}</p>
          )}
        </div>

        <div className="rounded-xl border border-hairline p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-navy">Book direkte</h2>
          {betalt && (
            <p className="mb-4 mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Takk! Betalingen er mottatt og bookingen er bekreftet. Du får en
              e-post med detaljene.
            </p>
          )}
          {avbrutt && (
            <p className="mb-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Betalingen ble avbrutt. Datoene er fortsatt ledige — prøv igjen
              når du er klar.
            </p>
          )}
          {property.base_nightly_rate != null && (
            <p className="mb-4 mt-1 text-sm text-ink">
              <span className="font-semibold text-navy">
                fra {formatNok(Number(property.base_nightly_rate))}
              </span>{" "}
              / natt
              {property.cleaning_fee != null && Number(property.cleaning_fee) > 0
                ? ` · + ${formatNok(Number(property.cleaning_fee))} rengjøring`
                : ""}
            </p>
          )}
          <div className="mt-4">
            <BookingForm
              action={createDirectBooking.bind(null, slug, kilde)}
              quoteAction={quoteBooking.bind(null, slug)}
              policyLines={CANCELLATION_POLICY_LINES}
              mode={property.booking_mode}
            />
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-navy">Tilgjengelighet</h2>
        <AvailabilityCalendar bookedDates={bookedDates} fromISO={today} months={3} />
      </section>
    </main>
  );
}

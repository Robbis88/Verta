import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, BedDouble, Bath, Star } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createDirectBooking, quoteBooking } from "@/app/properties/[slug]/actions";
import { getPublicCopy } from "@/lib/listing";
import { getNearbyPois, type Poi } from "@/lib/pois";
import { NearbyPois } from "@/components/public/nearby-pois";
import { bookedDateSet } from "@/lib/availability";
import { CANCELLATION_POLICY_LINES } from "@/lib/cancellation";
import { formatNok } from "@/lib/utils";
import { BookingForm } from "@/components/booking/booking-form";
import { AmenityList } from "@/components/properties/amenity-list";
import { PropertyMap } from "@/components/properties/property-map";
import { Gallery } from "@/components/public/gallery";
import { AmenityHighlights } from "@/components/public/amenity-highlights";
import { MobileBookingBar } from "@/components/public/mobile-booking-bar";
import { Footer } from "@/components/landing/Footer";

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
  beds: number | null;
  sleeping_arrangements: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  house_rules: string | null;
  amenities: string[] | null;
  lat: number | null;
  lng: number | null;
  public_listing: string | null;
  area_description: string | null;
  video_url: string | null;
  nearby_pois: Poi[] | null;
};

const SELECT =
  "id,name,description,address,bedrooms,bathrooms,max_guests,base_nightly_rate,cleaning_fee,booking_mode,images,beds,sleeping_arrangements,check_in_time,check_out_time,house_rules,amenities,lat,lng,public_listing,area_description,video_url,nearby_pois";

async function getProperty(slug: string): Promise<PublicProperty | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select(SELECT)
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
    .not("status", "in", "(cancelled,requested)");
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

  const priceBit =
    property.base_nightly_rate != null
      ? ` Fra ${formatNok(Number(property.base_nightly_rate))}/natt.`
      : "";
  const description = (
    property.public_listing?.replace(/\s+/g, " ").slice(0, 155) ??
    `Opplev ${property.name}.${priceBit} Se ledige datoer og book direkte.`
  ).trim();
  const image = property.images?.[0];

  return {
    title: `${property.name} — Verta`,
    description,
    alternates: { canonical: `/bo/${slug}` },
    openGraph: {
      title: property.name,
      description,
      type: "website",
      url: `/bo/${slug}`,
      images: image ? [{ url: image, width: 1200, height: 900 }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: property.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicStayPage({
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

  const [bookedDates, copy, pois] = await Promise.all([
    getBookedDates(property.id),
    getPublicCopy(property),
    getNearbyPois(property),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  const images = property.images ?? [];
  const heroImage = images[0];
  const amenities = property.amenities ?? [];
  const videoUrl = property.video_url;
  const isVideo = !!videoUrl && /\.(mp4|webm)(\?|$)/i.test(videoUrl);

  const specs = [
    property.max_guests != null
      ? { icon: Users, label: `${property.max_guests} gjester` }
      : null,
    property.bedrooms != null
      ? { icon: BedDouble, label: `${property.bedrooms} soverom` }
      : null,
    property.bathrooms != null
      ? { icon: Bath, label: `${property.bathrooms} bad` }
      : null,
  ].filter((s): s is { icon: typeof Users; label: string } => s !== null);

  const priceLabel =
    property.base_nightly_rate != null
      ? `fra ${formatNok(Number(property.base_nightly_rate))} / natt`
      : null;
  const ctaLabel =
    property.booking_mode === "request" ? "Send forespørsel" : "Book nå";

  const ruleChips = [
    amenities.includes("barnevennlig") ? "Barnevennlig" : null,
    amenities.includes("kjaeledyr") ? "Kjæledyr tillatt" : null,
    amenities.includes("royking") ? "Røyking tillatt" : "Røykfritt",
  ].filter(Boolean) as string[];

  return (
    <div className="scroll-smooth bg-white">
      {/* Hero */}
      <section className="relative flex h-[70vh] min-h-[460px] w-full flex-col">
        {isVideo ? (
          <video
            src={videoUrl!}
            autoPlay
            muted
            loop
            playsInline
            poster={heroImage}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt={property.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35" />

        {/* Toppbar */}
        <header className="relative z-10 flex items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            Verta
          </Link>
          <a
            href="#book"
            className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
          >
            {ctaLabel}
          </a>
        </header>

        {/* Hero-innhold */}
        <div className="relative z-10 mt-auto px-6 pb-10">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm md:text-5xl">
              {property.name}
            </h1>
            {property.address && (
              <p className="mt-2 text-lg text-white/85">{property.address}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-white/90">
              {specs.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5">
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </span>
              ))}
              {priceLabel && (
                <span className="rounded-full bg-gold px-3 py-1 font-semibold text-navy">
                  {priceLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 pb-28 lg:pb-16">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-10">
          {/* Innhold */}
          <div className="flex flex-col gap-12 lg:col-span-2">
            {/* Galleri */}
            {images.length > 1 && (
              <section className="pt-8">
                <Gallery images={images} name={property.name} />
              </section>
            )}

            {/* Om boligen */}
            {copy.listing && (
              <section>
                <h2 className="text-2xl font-bold text-navy">
                  Om {property.name}
                </h2>
                {amenities.length > 0 && (
                  <div className="mt-4">
                    <AmenityHighlights amenities={amenities} />
                  </div>
                )}
                <p className="mt-5 whitespace-pre-line leading-relaxed text-ink">
                  {copy.listing}
                </p>
              </section>
            )}

            {/* Soveplasser */}
            {property.sleeping_arrangements && (
              <section>
                <h2 className="text-2xl font-bold text-navy">Soveplasser</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">
                  {property.sleeping_arrangements}
                </p>
              </section>
            )}

            {/* Fasiliteter */}
            {amenities.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-bold text-navy">Fasiliteter</h2>
                <AmenityList amenities={amenities} />
              </section>
            )}

            {/* Beliggenhet */}
            {(property.lat != null || copy.area) && (
              <section>
                <h2 className="mb-3 text-2xl font-bold text-navy">Beliggenhet</h2>
                {copy.area && (
                  <p className="mb-4 leading-relaxed text-ink">{copy.area}</p>
                )}
                {property.lat != null && property.lng != null && (
                  <PropertyMap lat={property.lat} lng={property.lng} />
                )}
                {pois.length > 0 && (
                  <div className="mt-5">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">
                      I nærheten
                    </h3>
                    <NearbyPois pois={pois} />
                  </div>
                )}
              </section>
            )}

            {/* Husregler */}
            {(property.house_rules ||
              property.check_in_time ||
              ruleChips.length > 0) && (
              <section>
                <h2 className="mb-3 text-2xl font-bold text-navy">Husregler</h2>
                <div className="flex flex-wrap gap-2">
                  {(property.check_in_time || property.check_out_time) && (
                    <span className="rounded-full bg-cloud px-3 py-1 text-sm text-navy">
                      {property.check_in_time && `Innsjekk ${property.check_in_time}`}
                      {property.check_in_time && property.check_out_time && " · "}
                      {property.check_out_time && `utsjekk ${property.check_out_time}`}
                    </span>
                  )}
                  {ruleChips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-cloud px-3 py-1 text-sm text-navy"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                {property.house_rules && (
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">
                    {property.house_rules}
                  </p>
                )}
              </section>
            )}

            {/* Anmeldelser (klargjort for fremtiden) */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-2xl font-bold text-navy">
                <Star className="h-5 w-5 text-gold" />
                Anmeldelser
              </h2>
              <div className="rounded-2xl border border-dashed border-hairline p-6 text-center text-sm text-muted-foreground">
                Anmeldelser fra gjester kommer snart.
              </div>
            </section>
          </div>

          {/* Booking */}
          <aside className="lg:col-span-1">
            <div
              id="book"
              className="scroll-mt-6 rounded-2xl border border-hairline bg-white p-6 shadow-[0_12px_40px_rgba(8,27,51,0.10)] lg:sticky lg:top-6"
            >
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-xl font-bold text-navy">
                  {property.booking_mode === "request"
                    ? "Send forespørsel"
                    : "Book direkte"}
                </h2>
                {priceLabel && (
                  <span className="text-sm font-semibold text-gold">
                    {priceLabel}
                  </span>
                )}
              </div>

              {betalt && (
                <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  Takk! Betalingen er mottatt og bookingen er bekreftet. Du får
                  en e-post med detaljene.
                </p>
              )}
              {avbrutt && (
                <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Betalingen ble avbrutt. Datoene er fortsatt ledige — prøv igjen
                  når du er klar.
                </p>
              )}
              {property.cleaning_fee != null &&
                Number(property.cleaning_fee) > 0 && (
                  <p className="mb-4 text-xs text-muted-foreground">
                    + {formatNok(Number(property.cleaning_fee))} i rengjøring per
                    opphold.
                  </p>
                )}

              <BookingForm
                action={createDirectBooking.bind(null, slug, kilde)}
                quoteAction={quoteBooking.bind(null, slug)}
                policyLines={CANCELLATION_POLICY_LINES}
                mode={property.booking_mode}
                bookedDates={bookedDates}
                fromISO={today}
              />
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <MobileBookingBar priceLabel={priceLabel} ctaLabel={ctaLabel} />
    </div>
  );
}

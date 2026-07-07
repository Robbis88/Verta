import Link from "next/link";
import { Users, BedDouble, MapPin } from "lucide-react";

import { formatNok } from "@/lib/utils";

export type Listing = {
  slug: string;
  name: string;
  address: string | null;
  images: string[] | null;
  base_nightly_rate: number | null;
  max_guests: number | null;
  bedrooms: number | null;
};

/** Kort for en eiendom i markedsplassen. Lenker til /bo/[slug]. */
export function PropertyCard({ listing }: { listing: Listing }) {
  const image = listing.images?.[0];
  return (
    <Link
      href={`/bo/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm transition hover:shadow-[0_12px_40px_rgba(8,27,51,0.12)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cloud">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={listing.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink/40">
            Ingen bilder ennå
          </div>
        )}
        {listing.base_nightly_rate != null && (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-navy shadow-sm">
            fra {formatNok(Number(listing.base_nightly_rate))} / natt
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold text-navy">{listing.name}</h3>
        {listing.address && (
          <p className="flex items-center gap-1 text-sm text-ink/60">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{listing.address}</span>
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
          {listing.max_guests != null && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-gold" />
              {listing.max_guests} gjester
            </span>
          )}
          {listing.bedrooms != null && (
            <span className="flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-gold" />
              {listing.bedrooms} soverom
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

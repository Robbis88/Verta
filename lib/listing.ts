import { createAdminClient } from "@/lib/supabase/admin";
import {
  generatePropertyListing,
  generateAreaDescription,
  generateTravelGuide,
} from "@/lib/ai";
import { AMENITY_LABELS } from "@/lib/amenities";

type CopyInput = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  beds: number | null;
  max_guests: number | null;
  amenities: string[] | null;
  public_listing: string | null;
  area_description: string | null;
};

export type PublicCopy = { listing: string | null; area: string | null };

/**
 * Henter (og genererer ved behov) den offentlige AI-teksten for en eiendom.
 * Genereres kun én gang per eiendom og caches i properties — den offentlige
 * siden kaller altså ikke AI ved hvert besøk. Feiler AI, faller vi tilbake til
 * eierens egen beskrivelse, og siden rendrer alltid.
 */
export async function getPublicCopy(p: CopyInput): Promise<PublicCopy> {
  let listing = p.public_listing;
  let area = p.area_description;

  const needsGeneration =
    (!listing || !area) && Boolean(process.env.ANTHROPIC_API_KEY);

  if (needsGeneration) {
    try {
      if (!listing) {
        const amenityLabels = (p.amenities ?? [])
          .map((k) => AMENITY_LABELS[k])
          .filter(Boolean);
        listing = await generatePropertyListing({
          name: p.name,
          address: p.address,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          beds: p.beds,
          maxGuests: p.max_guests,
          amenities: amenityLabels,
          description: p.description,
        });
      }
      if (!area) {
        area = await generateAreaDescription({
          name: p.name,
          address: p.address,
        });
      }
      const admin = createAdminClient();
      await admin
        .from("properties")
        .update({ public_listing: listing, area_description: area })
        .eq("id", p.id);
    } catch (err) {
      console.error("getPublicCopy: AI-generering feilet", err);
    }
  }

  return {
    listing: listing || p.description || null,
    area: area || null,
  };
}

/**
 * Henter (og genererer ved behov) AI-reiseguiden for en eiendom. Genereres kun
 * én gang og caches i properties.travel_guide. Feiler AI, returneres null.
 */
export async function getTravelGuide(p: {
  id: string;
  name: string;
  address: string | null;
  travel_guide: string | null;
}): Promise<string | null> {
  if (p.travel_guide) return p.travel_guide;
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const guide = await generateTravelGuide({
      name: p.name,
      address: p.address,
    });
    if (guide) {
      const admin = createAdminClient();
      await admin
        .from("properties")
        .update({ travel_guide: guide })
        .eq("id", p.id);
    }
    return guide || null;
  } catch (err) {
    console.error("getTravelGuide: AI-generering feilet", err);
    return null;
  }
}

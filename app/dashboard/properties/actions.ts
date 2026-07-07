"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser, getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { propertyLimit } from "@/lib/constants";
import { propertySchema } from "@/lib/validation";
import { AMENITY_KEYS, AMENITY_LABELS } from "@/lib/amenities";
import { generatePropertyListing } from "@/lib/ai";
import { PROPERTY_IMAGES_BUCKET } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { geocodeNorway } from "@/lib/geocode";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Leser og validerer valgte fasiliteter fra skjemaet (flere avkrysninger). */
function parseAmenities(formData: FormData): string[] {
  return formData
    .getAll("amenities")
    .map(String)
    .filter((k) => AMENITY_KEYS.has(k));
}

export type PropertyFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createProperty(
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const user = await requireUser();

  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  // Feature-gating Layer 2 (RLS er Layer 1).
  const { count } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true });
  const limit = propertyLimit(
    profile?.plan ?? "gratis",
    profile?.extra_properties_count ?? 0,
  );
  if ((count ?? 0) >= limit) {
    return {
      error: `Du kan ikke ha mer enn ${limit} eiendom på ${profile?.plan ?? "gratis"}-planen.`,
    };
  }

  const data = parsed.data;
  const slug = `${slugify(data.name)}-${crypto.randomUUID().slice(0, 6)}`;
  const coords = data.address ? await geocodeNorway(data.address) : null;

  const { data: created, error } = await supabase
    .from("properties")
    .insert({
      user_id: user.id,
      name: data.name,
      slug,
      address: data.address || null,
      description: data.description || null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      max_guests: data.max_guests ?? null,
      base_nightly_rate: data.base_nightly_rate || null,
      cleaning_fee: data.cleaning_fee || null,
      access_info: data.access_info || null,
      wifi_name: data.wifi_name || null,
      wifi_password: data.wifi_password || null,
      house_rules: data.house_rules || null,
      checkout_info: data.checkout_info || null,
      booking_mode: data.booking_mode ?? "instant",
      amenities: parseAmenities(formData),
      beds: data.beds ?? null,
      sleeping_arrangements: data.sleeping_arrangements || null,
      check_in_time: data.check_in_time || null,
      check_out_time: data.check_out_time || null,
      market_value: data.market_value ?? null,
      loan_amount: data.loan_amount ?? null,
      interest_rate: data.interest_rate ?? null,
      monthly_principal: data.monthly_principal ?? null,
      video_url: (formData.get("video_url") as string)?.trim() || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit({
    user_id: user.id,
    action: "property.created",
    resource_type: "property",
    resource_id: created.id,
  });

  revalidatePath("/dashboard/properties");
  redirect(`/dashboard/properties/${created.id}`);
}

export async function updateProperty(
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Mangler eiendoms-id" };

  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Sjekk feltene under", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const data = parsed.data;
  const coords = data.address ? await geocodeNorway(data.address) : null;

  // RLS sikrer at bare eieren kan oppdatere.
  const { error } = await supabase
    .from("properties")
    .update({
      name: data.name,
      address: data.address || null,
      description: data.description || null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      max_guests: data.max_guests ?? null,
      base_nightly_rate: data.base_nightly_rate || null,
      cleaning_fee: data.cleaning_fee || null,
      access_info: data.access_info || null,
      wifi_name: data.wifi_name || null,
      wifi_password: data.wifi_password || null,
      house_rules: data.house_rules || null,
      checkout_info: data.checkout_info || null,
      booking_mode: data.booking_mode ?? "instant",
      amenities: parseAmenities(formData),
      beds: data.beds ?? null,
      sleeping_arrangements: data.sleeping_arrangements || null,
      check_in_time: data.check_in_time || null,
      check_out_time: data.check_out_time || null,
      market_value: data.market_value ?? null,
      loan_amount: data.loan_amount ?? null,
      interest_rate: data.interest_rate ?? null,
      monthly_principal: data.monthly_principal ?? null,
      video_url: (formData.get("video_url") as string)?.trim() || null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit({
    user_id: user.id,
    action: "property.updated",
    resource_type: "property",
    resource_id: id,
  });

  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}`);
  redirect(`/dashboard/properties/${id}`);
}

/** Laster opp ett eiendomsbilde til den offentlige bucketen og lagrer URL-en. */
export async function uploadPropertyImage(formData: FormData): Promise<void> {
  const user = await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  const file = formData.get("image");
  if (!propertyId) return;
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_IMAGE_BYTES) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return;

  const supabase = await createClient();
  // Eierskap + gjeldende bilder via RLS.
  const { data: property } = await supabase
    .from("properties")
    .select("id,images")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property) return;

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return;

  const { data: pub } = admin.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .getPublicUrl(path);
  const images = [
    ...(((property.images as string[] | null) ?? [])),
    pub.publicUrl,
  ];

  await supabase.from("properties").update({ images }).eq("id", propertyId);
  await logAudit({
    user_id: user.id,
    action: "property.image.added",
    resource_type: "property",
    resource_id: propertyId,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

/** Fjerner ett eiendomsbilde (fra listen og fra Storage). */
export async function deletePropertyImage(formData: FormData): Promise<void> {
  const user = await requireUser();
  const propertyId = String(formData.get("property_id") ?? "");
  const url = String(formData.get("url") ?? "");
  if (!propertyId || !url) return;

  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("id,images")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property) return;

  const images = (((property.images as string[] | null) ?? [])).filter(
    (u) => u !== url,
  );
  await supabase.from("properties").update({ images }).eq("id", propertyId);

  // Slett objektet fra Storage (path = alt etter «/property-images/»).
  const marker = `/${PROPERTY_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const path = url.slice(idx + marker.length);
    const admin = createAdminClient();
    await admin.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
  }

  await logAudit({
    user_id: user.id,
    action: "property.image.removed",
    resource_type: "property",
    resource_id: propertyId,
  });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

/** Lagrer eierens redigerte offentlige annonsetekst. */
export async function savePublicListing(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const text = String(formData.get("public_listing") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  // RLS sikrer at bare eieren kan oppdatere.
  await supabase
    .from("properties")
    .update({ public_listing: text || null })
    .eq("id", id);

  await logAudit({
    user_id: user.id,
    action: "property.listing.saved",
    resource_type: "property",
    resource_id: id,
  });
  revalidatePath(`/dashboard/properties/${id}`);
}

/** Regenererer den offentlige annonseteksten med AI i valgt tone. */
export async function regeneratePublicListing(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const tone = String(formData.get("tone") ?? "vennlig og inspirerende");
  if (!id) return;

  const supabase = await createClient();
  const { data: p } = await supabase
    .from("properties")
    .select(
      "id,name,address,description,bedrooms,bathrooms,beds,max_guests,amenities",
    )
    .eq("id", id)
    .single();
  if (!p) return;

  try {
    const amenityLabels = ((p.amenities as string[] | null) ?? [])
      .map((k) => AMENITY_LABELS[k])
      .filter(Boolean);
    const listing = await generatePropertyListing({
      name: p.name,
      address: p.address,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      beds: p.beds,
      maxGuests: p.max_guests,
      amenities: amenityLabels,
      description: p.description,
      tone,
    });
    if (listing) {
      await supabase
        .from("properties")
        .update({ public_listing: listing })
        .eq("id", id);
      await logAudit({
        user_id: user.id,
        action: "property.listing.regenerated",
        resource_type: "property",
        resource_id: id,
        changes: { tone },
      });
    }
  } catch (err) {
    console.error("regeneratePublicListing:", err);
  }
  revalidatePath(`/dashboard/properties/${id}`);
}

export async function deleteProperty(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", id);

  if (!error) {
    await logAudit({
      user_id: user.id,
      action: "property.deleted",
      resource_type: "property",
      resource_id: id,
      severity: "warning",
    });
  }

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

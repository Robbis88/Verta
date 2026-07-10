import { createAdminClient } from "@/lib/supabase/admin";

export type Review = {
  id: string;
  guest_name: string;
  rating: number;
  comment: string | null;
  owner_reply: string | null;
  created_at: string;
};

export type ReviewSummary = {
  reviews: Review[];
  count: number;
  average: number | null;
};

/** Henter anmeldelser for en eiendom (offentlig visning, via service-role). */
export async function getPropertyReviews(
  propertyId: string,
): Promise<ReviewSummary> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("property_reviews")
    .select("id,guest_name,rating,comment,owner_reply,created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  const reviews = (data ?? []) as Review[];
  const count = reviews.length;
  const average =
    count > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) /
        10
      : null;
  return { reviews, count, average };
}

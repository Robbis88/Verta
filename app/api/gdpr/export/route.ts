import { createClient } from "@/lib/supabase/server";

/** Eksporterer alle data om innlogget bruker som nedlastbar JSON (GDPR). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // RLS sikrer at kun brukerens egne rader returneres.
  const [profile, properties, bookings, boosts, commissions, tax] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("properties").select("*"),
      supabase.from("bookings").select("*"),
      supabase.from("boosts").select("*"),
      supabase.from("commissions").select("*"),
      supabase.from("tax_reports").select("*"),
    ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: profile.data,
    properties: properties.data ?? [],
    bookings: bookings.data ?? [],
    boosts: boosts.data ?? [],
    commissions: commissions.data ?? [],
    tax_reports: tax.data ?? [],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="verta-mine-data.json"',
    },
  });
}

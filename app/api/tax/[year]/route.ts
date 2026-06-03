import { createClient } from "@/lib/supabase/server";

/** JSON-eksport av brukerens skatterapport for et gitt år (RLS-beskyttet). */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ year: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { year } = await ctx.params;
  const { data } = await supabase
    .from("tax_reports")
    .select("*")
    .eq("year", Number(year))
    .single();

  if (!data) return new Response("Ikke funnet", { status: 404 });
  return Response.json(data);
}

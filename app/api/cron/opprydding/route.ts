import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daglig (se vercel.json): retensjon/dataminimering. Sletter meldinger
 * (gjestekommunikasjon + lagrede AI-svar) eldre enn RETENSJON_MND. Rører
 * ikke bookinger eller annen bokføringspliktig data.
 * Krever CRON_SECRET (eller KONTROLLROM_KEY) kun hvis satt.
 */
const RETENSJON_MND = 24;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const nokkel = request.headers.get("x-api-key");
  const okCron =
    !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  const okKey =
    !!process.env.KONTROLLROM_KEY && nokkel === process.env.KONTROLLROM_KEY;
  if (!okCron && !okKey) {
    return new Response("Unauthorized", { status: 401 });
  }

  const grense = new Date();
  grense.setMonth(grense.getMonth() - RETENSJON_MND);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("messages")
      .delete()
      .lt("created_at", grense.toISOString())
      .select("id");

    if (error) {
      return Response.json({ feil: error.message }, { status: 200 });
    }
    return Response.json({ ok: true, slettet: data?.length ?? 0 });
  } catch (e) {
    return Response.json(
      { feil: e instanceof Error ? e.message : String(e) },
      { status: 200 },
    );
  }
}

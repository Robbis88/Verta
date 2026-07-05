import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, EXTRA_PROPERTY_PRICE_NOK, type Plan } from "@/lib/constants";
import { rapporterBruk } from "@/lib/kontrollrom";

/**
 * Daglig (se vercel.json): rapporterer brukere + planpris til kontrollrommet.
 * Krever CRON_SECRET kun hvis satt.
 */
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

  try {
    const supabase = createAdminClient();
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, plan, extra_properties_count");

    if (error) {
      return Response.json({ feil: `users: ${error.message}` }, { status: 200 });
    }

    const abonnement = (users ?? [])
      .map((u) => {
        const plan = (u.plan ?? "gratis") as Plan;
        if (plan === "gratis") return null;
        let belop = PLANS[plan]?.priceNok ?? 0;
        if (plan === "premium") {
          belop += (u.extra_properties_count ?? 0) * EXTRA_PROPERTY_PRICE_NOK;
        }
        return {
          ekstern_ref: u.id as string,
          navn: (u.email as string) ?? "Ukjent",
          epost: (u.email as string) ?? null,
          belop,
          intervall: "mnd" as const,
          status: "active" as const,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const ok = await rapporterBruk({
      antall_brukere: users?.length ?? 0,
      abonnement,
    });

    return Response.json({ ok, antall: abonnement.length });
  } catch (e) {
    return Response.json(
      { feil: e instanceof Error ? e.message : String(e) },
      { status: 200 },
    );
  }
}

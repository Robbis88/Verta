import { computeCommissions } from "@/lib/commissions";

/**
 * Månedlig cron (se vercel.json). Beregner provisjon for forrige måned.
 * Beskyttet med CRON_SECRET (Vercel cron sender Authorization: Bearer ...).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Forrige måned (UTC).
  const now = new Date();
  let year = now.getUTCFullYear();
  let month0 = now.getUTCMonth() - 1;
  if (month0 < 0) {
    month0 = 11;
    year -= 1;
  }

  const result = await computeCommissions(year, month0);
  return Response.json(result);
}

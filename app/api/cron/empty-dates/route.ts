import { scanAllProperties } from "@/lib/alerts";

/**
 * Daglig cron (se vercel.json). Skanner alle eiendommer for tomme datoer
 * og oppretter varsler. Beskyttet med CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await scanAllProperties();
  return Response.json(result);
}

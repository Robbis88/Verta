import { sendHeartbeat } from "@/lib/kontrollrom";

/**
 * Heartbeat-cron (se vercel.json). Forteller kontrollrommet at Verta lever.
 * Beskyttet med CRON_SECRET — samme mønster som de andre cron-rutene.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ok = await sendHeartbeat();
  return Response.json({ ok });
}

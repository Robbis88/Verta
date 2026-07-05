import { processRemainingPayments } from "@/lib/booking";

/**
 * Time-cron (se vercel.json). Varsler om restbetaling 48t/24t før fristen
 * (7 dager før innsjekk), og avbestiller bookinger der fristen er passert uten
 * betaling (depositum beholdes). Beskyttet med CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await processRemainingPayments();
  return Response.json(result);
}

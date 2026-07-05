import { sendRemainingReminders } from "@/lib/booking";

/**
 * Daglig cron (se vercel.json). Sender påminnelse om restbetaling for
 * bekreftede bookinger der innsjekk er innen 7 dager og resten ikke er betalt.
 * Beskyttet med CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sent = await sendRemainingReminders(7);
  return Response.json({ sent });
}

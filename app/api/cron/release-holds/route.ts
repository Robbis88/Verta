import { releaseExpiredHolds } from "@/lib/booking";

/**
 * Frigjør utløpte booking-reservasjoner (pending forbi hold_expires_at).
 * Backup for checkout.session.expired-webhooken. Beskyttet med CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const released = await releaseExpiredHolds();
  return Response.json({ released });
}

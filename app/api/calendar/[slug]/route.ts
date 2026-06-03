import { createAdminClient } from "@/lib/supabase/admin";
import { buildICalendar } from "@/lib/ical";

type BookingRow = {
  id: string;
  check_in: string;
  check_out: string;
  status: string;
};

function dtstampNow(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * Offentlig iCal-feed for en eiendom. Lim URL-en inn i Airbnb/Booking så de
 * blokkerer datoer som er booket via Verta. Viser kun datoer, ikke gjestedata.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const supabase = createAdminClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id,name")
    .eq("slug", slug)
    .single();
  if (!property) return new Response("Ikke funnet", { status: 404 });

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("id,check_in,check_out,status")
    .eq("property_id", property.id)
    .neq("status", "cancelled");
  const bookings = (bookingsData ?? []) as BookingRow[];

  const ics = buildICalendar(
    bookings.map((b) => ({
      uid: `${b.id}@verta`,
      start: b.check_in,
      end: b.check_out,
      summary: "Opptatt",
    })),
    `Verta – ${property.name}`,
    dtstampNow(),
  );

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}

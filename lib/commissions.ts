import { createAdminClient } from "@/lib/supabase/admin";
import { COMMISSION_RATE } from "@/lib/constants";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** Bookingkilder som genererer provisjon til Verta. */
const CHANNEL_SOURCES = ["verta_instagram", "verta_facebook"];

export function periodLabel(year: number, month0: number): string {
  return `${MONTHS[month0]}_${year}`;
}

type BookingRow = {
  id: string;
  property_id: string;
  total_price: number | null;
};

export type CommissionResult = {
  period: string;
  users: number;
  totalCommission: number;
};

/**
 * Beregner provisjon for en gitt måned (month0 = 0–11) og upserter én rad
 * per bruker i commissions. Idempotent via unik (user_id, period).
 */
export async function computeCommissions(
  year: number,
  month0: number,
): Promise<CommissionResult> {
  const period = periodLabel(year, month0);
  const start = new Date(Date.UTC(year, month0, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(year, month0 + 1, 1)).toISOString().slice(0, 10);

  const supabase = createAdminClient();

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("id,property_id,total_price")
    .in("source", CHANNEL_SOURCES)
    .neq("status", "cancelled")
    .gte("check_in", start)
    .lt("check_in", end);
  const bookings = (bookingsData ?? []) as BookingRow[];

  if (bookings.length === 0) {
    return { period, users: 0, totalCommission: 0 };
  }

  // Knytt bookinger til eier via property.
  const propertyIds = [...new Set(bookings.map((b) => b.property_id))];
  const { data: props } = await supabase
    .from("properties")
    .select("id,user_id")
    .in("id", propertyIds);
  const userByProperty = new Map(
    ((props ?? []) as { id: string; user_id: string }[]).map((p) => [
      p.id,
      p.user_id,
    ]),
  );

  // Grupper per bruker.
  const perUser = new Map<string, { revenue: number; bookingIds: string[] }>();
  for (const b of bookings) {
    const userId = userByProperty.get(b.property_id);
    if (!userId) continue;
    const entry = perUser.get(userId) ?? { revenue: 0, bookingIds: [] };
    entry.revenue += Number(b.total_price) || 0;
    entry.bookingIds.push(b.id);
    perUser.set(userId, entry);
  }

  let totalCommission = 0;
  const rows = [...perUser.entries()].map(([userId, e]) => {
    const commission = Math.round(e.revenue * COMMISSION_RATE * 100) / 100;
    totalCommission += commission;
    return {
      user_id: userId,
      period,
      booking_ids: e.bookingIds,
      total_revenue: e.revenue,
      commission_amount: commission,
      status: "pending",
    };
  });

  if (rows.length > 0) {
    await supabase.from("commissions").upsert(rows, { onConflict: "user_id,period" });
  }

  return { period, users: rows.length, totalCommission };
}

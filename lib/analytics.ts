import { createClient } from "@/lib/supabase/server";

type BookingRow = {
  total_price: number | null;
  source: string;
  check_in: string;
  nights: number | null;
  status: string;
};

type BoostRow = {
  budget_nok: number | null;
  revenue_from_boost: number | null;
  status: string;
};

export type SourceStat = { source: string; count: number; revenue: number };

export type DashboardMetrics = {
  year: number;
  propertyCount: number;
  bookingCount: number;
  totalRevenue: number;
  bookedNights: number;
  occupancyPct: number;
  byMonth: number[]; // 12 verdier, inntekt per måned
  bySource: SourceStat[];
  boostSpend: number;
  boostRevenue: number;
};

/** Aggregerer dashboard-tall for innlogget bruker (RLS) for et gitt år. */
export async function getDashboardMetrics(
  year: number,
): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const { data: properties } = await supabase.from("properties").select("id");
  const propertyCount = properties?.length ?? 0;

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("total_price,source,check_in,nights,status")
    .gte("check_in", `${year}-01-01`)
    .lt("check_in", `${year + 1}-01-01`);
  const bookings = ((bookingsData ?? []) as BookingRow[]).filter(
    (b) => b.status !== "cancelled",
  );

  const byMonth = Array<number>(12).fill(0);
  const sourceMap = new Map<string, SourceStat>();
  let totalRevenue = 0;
  let bookedNights = 0;

  for (const b of bookings) {
    const revenue = Number(b.total_price) || 0;
    totalRevenue += revenue;
    bookedNights += Number(b.nights) || 0;

    const month = new Date(b.check_in).getUTCMonth();
    if (month >= 0 && month < 12) byMonth[month] += revenue;

    const stat = sourceMap.get(b.source) ?? {
      source: b.source,
      count: 0,
      revenue: 0,
    };
    stat.count += 1;
    stat.revenue += revenue;
    sourceMap.set(b.source, stat);
  }

  const { data: boostsData } = await supabase
    .from("boosts")
    .select("budget_nok,revenue_from_boost,status");
  const boosts = (boostsData ?? []) as BoostRow[];
  const boostSpend = boosts
    .filter((b) => b.status !== "pending" && b.status !== "failed")
    .reduce((s, b) => s + (Number(b.budget_nok) || 0), 0);
  const boostRevenue = boosts.reduce(
    (s, b) => s + (Number(b.revenue_from_boost) || 0),
    0,
  );

  const occupancyPct =
    propertyCount > 0
      ? Math.round((bookedNights / (propertyCount * 365)) * 100)
      : 0;

  return {
    year,
    propertyCount,
    bookingCount: bookings.length,
    totalRevenue,
    bookedNights,
    occupancyPct,
    byMonth,
    bySource: [...sourceMap.values()].sort((a, b) => b.revenue - a.revenue),
    boostSpend,
    boostRevenue,
  };
}

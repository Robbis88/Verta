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

export type UpcomingBooking = {
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  source: string;
};

export type TaskItem = {
  propertyName: string;
  type: string;
  date: string;
  done: boolean;
};

export type DashboardMetrics = {
  year: number;
  propertyCount: number;
  bookingCount: number;
  totalRevenue: number;
  bookedNights: number;
  occupancyPct: number;
  byMonth: number[]; // 12 verdier, inntekt per måned
  nightsByMonth: number[]; // 12 verdier, bookede netter per måned
  bySource: SourceStat[];
  boostSpend: number;
  boostRevenue: number;
  upcoming: UpcomingBooking[]; // neste kommende bookinger (maks 5)
  upcomingCount: number; // totalt antall kommende bookinger
  tasks: TaskItem[]; // kommende rengjøringsoppgaver
};

/** Aggregerer dashboard-tall for innlogget bruker (RLS) for et gitt år. */
export async function getDashboardMetrics(
  year: number,
): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("id,name");
  const propertyCount = properties?.length ?? 0;
  const propertyName = new Map(
    ((properties ?? []) as { id: string; name: string }[]).map((p) => [
      p.id,
      p.name,
    ]),
  );

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("total_price,source,check_in,nights,status")
    .gte("check_in", `${year}-01-01`)
    .lt("check_in", `${year + 1}-01-01`);
  const bookings = ((bookingsData ?? []) as BookingRow[]).filter(
    (b) => b.status !== "cancelled",
  );

  const byMonth = Array<number>(12).fill(0);
  const nightsByMonth = Array<number>(12).fill(0);
  const sourceMap = new Map<string, SourceStat>();
  let totalRevenue = 0;
  let bookedNights = 0;

  for (const b of bookings) {
    const revenue = Number(b.total_price) || 0;
    const nights = Number(b.nights) || 0;
    totalRevenue += revenue;
    bookedNights += nights;

    const month = new Date(b.check_in).getUTCMonth();
    if (month >= 0 && month < 12) {
      byMonth[month] += revenue;
      nightsByMonth[month] += nights;
    }

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

  const today = new Date().toISOString().slice(0, 10);

  // Kommende bookinger (fra og med i dag) — ekte gjester, sortert på innsjekk.
  const { data: upcomingData } = await supabase
    .from("bookings")
    .select("guest_name,source,check_in,check_out,property_id,status")
    .gte("check_in", today)
    .order("check_in", { ascending: true })
    .limit(6);
  const upcoming: UpcomingBooking[] = ((upcomingData ?? []) as (BookingRow & {
    guest_name: string | null;
    check_out: string;
    property_id: string;
  })[])
    .filter((b) => b.status !== "cancelled")
    .slice(0, 5)
    .map((b) => ({
      guestName: b.guest_name ?? "Gjest",
      propertyName: propertyName.get(b.property_id) ?? "—",
      checkIn: b.check_in,
      checkOut: b.check_out,
      source: b.source,
    }));

  const { count: upcomingCountRaw } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .gte("check_in", today)
    .neq("status", "cancelled");
  const upcomingCount = upcomingCountRaw ?? upcoming.length;

  // Kommende rengjøringsoppgaver — ekte oppgaver fra cleaning_tasks.
  const { data: taskData } = await supabase
    .from("cleaning_tasks")
    .select("property_id,type,task_date,status")
    .gte("task_date", today)
    .order("task_date", { ascending: true })
    .limit(6);
  const tasks: TaskItem[] = (
    (taskData ?? []) as {
      property_id: string;
      type: string;
      task_date: string;
      status: string;
    }[]
  )
    .slice(0, 5)
    .map((t) => ({
      propertyName: propertyName.get(t.property_id) ?? "—",
      type: t.type,
      date: t.task_date,
      done: t.status === "completed",
    }));

  return {
    year,
    propertyCount,
    bookingCount: bookings.length,
    totalRevenue,
    bookedNights,
    occupancyPct,
    byMonth,
    nightsByMonth,
    bySource: [...sourceMap.values()].sort((a, b) => b.revenue - a.revenue),
    boostSpend,
    boostRevenue,
    upcoming,
    upcomingCount,
    tasks,
  };
}

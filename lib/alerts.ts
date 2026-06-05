import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookedDateSet } from "@/lib/availability";

const WINDOW_DAYS = 60;
const LOW_OCCUPANCY = 40; // %
const BIG_GAP = 10; // netter
const IMMINENT_DAYS = 14;
const IMMINENT_MIN = 3; // netter

export type AlertRow = {
  property_id: string;
  type: "low_occupancy" | "large_gap" | "imminent_empty";
  severity: "normal" | "warning" | "critical";
  gap_start: string | null;
  gap_end: string | null;
  occupancy_pct: number | null;
  message: string;
};

type BookingRange = { check_in: string; check_out: string; status?: string };

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Beregner varsler for én eiendom ut fra bookingene de neste 60 dagene. */
export function computeAlerts(
  propertyId: string,
  propertyName: string,
  bookings: BookingRange[],
  today: Date,
): AlertRow[] {
  const booked = bookedDateSet(bookings);
  const start = new Date(`${isoDay(today)}T00:00:00Z`);

  const days: { iso: string; free: boolean }[] = [];
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = isoDay(d);
    days.push({ iso, free: !booked.has(iso) });
  }

  const freeCount = days.filter((d) => d.free).length;
  const occupancy = Math.round(((WINDOW_DAYS - freeCount) / WINDOW_DAYS) * 100);

  // Sammenhengende ledige strekk.
  const stretches: { start: string; end: string; len: number; startIdx: number }[] = [];
  let i = 0;
  while (i < days.length) {
    if (days[i].free) {
      let j = i;
      while (j < days.length && days[j].free) j++;
      stretches.push({ start: days[i].iso, end: days[j - 1].iso, len: j - i, startIdx: i });
      i = j;
    } else {
      i++;
    }
  }

  const alerts: AlertRow[] = [];

  // Nært forestående tomt (kritisk): ledig strekk som starter innen 14 dager.
  const imminent = stretches.find(
    (s) => s.startIdx < IMMINENT_DAYS && s.len >= IMMINENT_MIN,
  );
  if (imminent) {
    alerts.push({
      property_id: propertyId,
      type: "imminent_empty",
      severity: "critical",
      gap_start: imminent.start,
      gap_end: imminent.end,
      occupancy_pct: null,
      message: `${propertyName}: ${imminent.len} ledige netter fra ${imminent.start} — innen 14 dager.`,
    });
  }

  // Store hull (advarsel): ledig strekk ≥ 10 netter.
  for (const s of stretches) {
    if (s.len >= BIG_GAP) {
      alerts.push({
        property_id: propertyId,
        type: "large_gap",
        severity: "warning",
        gap_start: s.start,
        gap_end: s.end,
        occupancy_pct: null,
        message: `${propertyName}: ${s.len} netter ledig (${s.start} – ${s.end}).`,
      });
    }
  }

  // Lavt belegg (advarsel).
  if (occupancy < LOW_OCCUPANCY) {
    alerts.push({
      property_id: propertyId,
      type: "low_occupancy",
      severity: "warning",
      gap_start: null,
      gap_end: null,
      occupancy_pct: occupancy,
      message: `${propertyName}: ${occupancy}% belegg de neste 60 dagene.`,
    });
  }

  return alerts;
}

type ScanClient = Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>;

async function scanWith(supabase: ScanClient): Promise<{ created: number }> {
  const { data: properties } = await supabase
    .from("properties")
    .select("id,name");
  const today = new Date();
  let created = 0;

  for (const p of (properties ?? []) as { id: string; name: string }[]) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("check_in,check_out,status")
      .eq("property_id", p.id);
    const alerts = computeAlerts(p.id, p.name, (bookings ?? []) as BookingRange[], today);

    // Idempotent: fjern tidligere ubehandlede varsler før nye legges inn.
    await supabase
      .from("empty_date_alerts")
      .delete()
      .eq("property_id", p.id)
      .eq("status", "pending");
    if (alerts.length > 0) {
      await supabase.from("empty_date_alerts").insert(alerts);
      created += alerts.length;
    }
  }
  return { created };
}

/** Skann for innlogget eier (RLS sørger for kun egne eiendommer). */
export async function scanForUser(): Promise<{ created: number }> {
  const supabase = await createClient();
  return scanWith(supabase);
}

/** Skann for alle eiendommer (cron, admin-klient). */
export async function scanAllProperties(): Promise<{ created: number }> {
  return scanWith(createAdminClient());
}

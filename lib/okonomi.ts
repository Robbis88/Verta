import { createClient } from "@/lib/supabase/server";
import { getMockEconomy, type Economy } from "@/lib/okonomi-mock";

export type PropertyRef = { id: string; name: string };

type Supa = Awaited<ReturnType<typeof createClient>>;

const MONTHS = [
  "Januar",
  "Februar",
  "Mars",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Bookingkilder → inntektslinjer på økonomisiden. */
const INCOME_SOURCES: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: "airbnb", label: "Airbnb", match: (s) => s === "airbnb" },
  { key: "booking", label: "Booking.com", match: (s) => s === "booking" },
  { key: "direkte", label: "Direktebooking", match: (s) => s === "verta_direct" },
  {
    key: "sosiale",
    label: "Sosiale kanaler",
    match: (s) => s === "verta_instagram" || s === "verta_facebook",
  },
];

type BookingRow = {
  source: string;
  total_price: number | null;
  check_in: string;
  nights: number | null;
};

/**
 * Regner ekte inntekt for en eiendom fra bookingene. Returnerer null hvis det
 * ikke finnes bookinger (da faller vi tilbake til mock, så demoen ser hel ut).
 */
async function computeIncome(
  supabase: Supa,
  propertyId: string,
): Promise<Economy["income"] | null> {
  const { data } = await supabase
    .from("bookings")
    .select("source,total_price,check_in,nights")
    .eq("property_id", propertyId)
    .neq("status", "cancelled");

  const rows = (data ?? []) as BookingRow[];
  if (rows.length === 0) return null;

  const now = new Date();
  const curYear = now.getUTCFullYear();
  const curMonth = now.getUTCMonth();

  const sources = INCOME_SOURCES.map((def) => {
    let thisMonth = 0;
    let ytd = 0;
    let lastYear = 0;
    for (const b of rows) {
      if (!def.match(b.source)) continue;
      const price = Number(b.total_price) || 0;
      const y = Number(b.check_in.slice(0, 4));
      const m = Number(b.check_in.slice(5, 7)) - 1;
      if (y === curYear) {
        ytd += price;
        if (m === curMonth) thisMonth += price;
      } else if (y === curYear - 1) {
        lastYear += price;
      }
    }
    return { key: def.key, label: def.label, thisMonth, ytd, lastYear };
  });

  let nightsYtd = 0;
  let revenueYtd = 0;
  const monthRevenue = new Array(12).fill(0);
  for (const b of rows) {
    const y = Number(b.check_in.slice(0, 4));
    if (y !== curYear) continue;
    const m = Number(b.check_in.slice(5, 7)) - 1;
    const price = Number(b.total_price) || 0;
    nightsYtd += Number(b.nights) || 0;
    revenueYtd += price;
    monthRevenue[m] += price;
  }

  const dayOfYear =
    Math.floor(
      (Date.UTC(curYear, curMonth, now.getUTCDate()) - Date.UTC(curYear, 0, 1)) /
        86_400_000,
    ) + 1;
  const occupancyPct =
    dayOfYear > 0 ? Math.min(100, Math.round((nightsYtd / dayOfYear) * 100)) : 0;
  const avgNightly = nightsYtd > 0 ? Math.round(revenueYtd / nightsYtd) : 0;

  const withRevenue = monthRevenue
    .map((r, i) => ({ r, i }))
    .filter((x) => x.r > 0);
  const best = withRevenue.length
    ? withRevenue.reduce((a, b) => (b.r > a.r ? b : a))
    : null;
  const worst = withRevenue.length
    ? withRevenue.reduce((a, b) => (b.r < a.r ? b : a))
    : null;

  return {
    sources,
    occupancyPct,
    avgNightly,
    bestMonth: best ? MONTHS[best.i] : "–",
    worstMonth: worst ? MONTHS[worst.i] : "–",
  };
}

/**
 * Kontekst for Eiendomsøkonomi: brukerens ekte eiendommer (via RLS) + valgt
 * eiendom. Inntektene er ekte (fra bookinger); resten er foreløpig mock.
 */
export async function getEconomyContext(eiendomId?: string): Promise<{
  properties: PropertyRef[];
  selected: PropertyRef | null;
  economy: Economy | null;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id,name")
    .order("created_at", { ascending: true });

  const properties = (data ?? []) as PropertyRef[];
  if (properties.length === 0) {
    return { properties, selected: null, economy: null };
  }

  const selected = properties.find((p) => p.id === eiendomId) ?? properties[0];
  const economy = getMockEconomy(selected.id, selected.name);

  // Ekte inntekt overstyrer mock hvis eiendommen har bookinger.
  const realIncome = await computeIncome(supabase, selected.id);
  if (realIncome) economy.income = realIncome;

  return { properties, selected, economy };
}

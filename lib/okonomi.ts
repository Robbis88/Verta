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

const EXPENSE_LABELS: Record<string, string> = {
  utilities: "Strøm, internett, avgifter",
  insurance: "Forsikring",
  cleaning: "Rengjøring / vask",
  maintenance: "Vedlikehold",
  supplies: "Forbruksvarer",
  fee: "Gebyrer",
  other: "Andre kostnader",
};
const EXPENSE_ORDER = [
  "utilities",
  "insurance",
  "cleaning",
  "maintenance",
  "supplies",
  "fee",
  "other",
];

type ExpenseRow = { category: string; amount: number | null };

/**
 * Regner ekte månedlige kostnader fra utgiftene (snitt av siste 12 måneder per
 * kategori). Beholder lån-linjene (renter/avdrag) fra mock til vi har lånedata.
 * Returnerer null hvis det ikke finnes utgifter (da beholdes mock).
 */
async function computeCosts(
  supabase: Supa,
  propertyId: string,
  economy: Economy,
): Promise<Economy["costs"] | null> {
  const from = new Date();
  from.setUTCMonth(from.getUTCMonth() - 12);

  const { data } = await supabase
    .from("expenses")
    .select("category,amount")
    .eq("property_id", propertyId)
    .gte("expense_date", from.toISOString().slice(0, 10));

  const rows = (data ?? []) as ExpenseRow[];
  if (rows.length === 0) return null;

  const byCat: Record<string, number> = {};
  for (const e of rows) {
    byCat[e.category] = (byCat[e.category] ?? 0) + (Number(e.amount) || 0);
  }

  const loanLines = economy.costs.filter(
    (c) => c.key === "renter" || c.key === "avdrag",
  );
  const expenseLines = EXPENSE_ORDER.filter((c) => byCat[c]).map((c) => ({
    key: c,
    label: EXPENSE_LABELS[c],
    monthly: Math.round(byCat[c] / 12),
  }));

  return [...loanLines, ...expenseLines];
}

type PropertyFinance = {
  id: string;
  name: string;
  market_value: number | null;
  loan_amount: number | null;
  interest_rate: number | null;
  monthly_principal: number | null;
};

/** Overstyrer mock-verdi/lån/rente med eiendommens ekte finansfelter. */
function applyFinancials(economy: Economy, row: PropertyFinance): void {
  if (row.market_value != null) economy.value = Number(row.market_value);
  if (row.loan_amount != null) economy.loan = Number(row.loan_amount);
  if (row.interest_rate != null) {
    economy.interestRatePct = Number(row.interest_rate);
  }
  // Renter utledes av lån + rente.
  const renter = economy.costs.find((c) => c.key === "renter");
  if (renter) {
    renter.monthly = Math.round(
      (economy.loan * (economy.interestRatePct / 100)) / 12,
    );
  }
  if (row.monthly_principal != null) {
    const avdrag = economy.costs.find((c) => c.key === "avdrag");
    if (avdrag) avdrag.monthly = Number(row.monthly_principal);
  }
}

/**
 * Kontekst for Eiendomsøkonomi: brukerens ekte eiendommer (via RLS) + valgt
 * eiendom. Inntekter (bookinger), kostnader (utgifter) og verdi/lån/rente
 * (eiendomsfelter) er ekte; eiere og historikk er foreløpig mock.
 */
export async function getEconomyContext(eiendomId?: string): Promise<{
  properties: PropertyRef[];
  selected: PropertyRef | null;
  economy: Economy | null;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id,name,market_value,loan_amount,interest_rate,monthly_principal")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as PropertyFinance[];
  const properties: PropertyRef[] = rows.map((r) => ({ id: r.id, name: r.name }));
  if (rows.length === 0) {
    return { properties, selected: null, economy: null };
  }

  const selectedRow = rows.find((r) => r.id === eiendomId) ?? rows[0];
  const selected: PropertyRef = { id: selectedRow.id, name: selectedRow.name };
  const economy = getMockEconomy(selected.id, selected.name);
  applyFinancials(economy, selectedRow);

  // Ekte inntekt overstyrer mock hvis eiendommen har bookinger.
  const realIncome = await computeIncome(supabase, selected.id);
  if (realIncome) economy.income = realIncome;

  // Ekte kostnader overstyrer mock hvis eiendommen har utgifter.
  const realCosts = await computeCosts(supabase, selected.id, economy);
  if (realCosts) economy.costs = realCosts;

  return { properties, selected, economy };
}

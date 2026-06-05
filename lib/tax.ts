import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Forenklet norsk skatteberegning for korttidsutleie av egen bolig:
 * fribeløp på 15 000 kr, deretter er 85 % av det overskytende skattepliktig.
 * (Hytte/sekundærbolig har andre regler — dette er et utgangspunkt.)
 */
export const TAX_FREE_AMOUNT = 15000;
export const TAXABLE_RATE = 0.85;

export type TaxReport = {
  year: number;
  total_income: number;
  income_from_airbnb: number;
  income_from_booking: number;
  income_from_verta_direct: number;
  income_from_verta_boosts: number;
  verta_commission_paid: number;
  total_expenses: number;
  net_income: number;
  taxable_income: number;
  status: string;
};

type BookingRow = { total_price: number | null; source: string };
type CommissionRow = { period: string; commission_amount: number | null };
type ExpenseRow = { amount: number | null };

/**
 * Beregner skatterapport for innlogget bruker og lagrer den (status 'draft').
 * Bruker RLS-klienten, så kun brukerens egne data telles.
 */
export async function computeTaxReport(year: number): Promise<TaxReport> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("total_price,source")
    .neq("status", "cancelled")
    .gte("check_in", `${year}-01-01`)
    .lt("check_in", `${year + 1}-01-01`);
  const bookings = (bookingsData ?? []) as BookingRow[];

  const sumBy = (sources: string[]) =>
    bookings
      .filter((b) => sources.includes(b.source))
      .reduce((s, b) => s + (Number(b.total_price) || 0), 0);

  const income_from_airbnb = sumBy(["airbnb"]);
  const income_from_booking = sumBy(["booking"]);
  const income_from_verta_direct = sumBy(["verta_direct"]);
  const income_from_verta_boosts = sumBy(["verta_instagram", "verta_facebook"]);
  const total_income =
    income_from_airbnb +
    income_from_booking +
    income_from_verta_direct +
    income_from_verta_boosts;

  const { data: commData } = await supabase
    .from("commissions")
    .select("period,commission_amount");
  const verta_commission_paid = ((commData ?? []) as CommissionRow[])
    .filter((c) => c.period.endsWith(`_${year}`))
    .reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);

  // Fradragsberettigede utgifter for året (RLS gir kun egne eiendommer).
  const { data: expData } = await supabase
    .from("expenses")
    .select("amount")
    .gte("expense_date", `${year}-01-01`)
    .lt("expense_date", `${year + 1}-01-01`);
  const total_expenses =
    Math.round(
      ((expData ?? []) as ExpenseRow[]).reduce(
        (s, e) => s + (Number(e.amount) || 0),
        0,
      ) * 100,
    ) / 100;

  // Netto utleieresultat (regnskapsligning, f.eks. hytte/sekundærbolig).
  const net_income = Math.round((total_income - total_expenses) * 100) / 100;

  // Forenklet egen-bolig-modell: 85 % av det som overstiger fribeløpet.
  const taxable_income =
    Math.round(Math.max(0, total_income - TAX_FREE_AMOUNT) * TAXABLE_RATE * 100) /
    100;

  const report: TaxReport = {
    year,
    total_income,
    income_from_airbnb,
    income_from_booking,
    income_from_verta_direct,
    income_from_verta_boosts,
    verta_commission_paid,
    total_expenses,
    net_income,
    taxable_income,
    status: "draft",
  };

  await supabase
    .from("tax_reports")
    .upsert({ user_id: user.id, ...report }, { onConflict: "user_id,year" });

  return report;
}

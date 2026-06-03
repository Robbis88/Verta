import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, EXTRA_PROPERTY_PRICE_NOK, type Plan } from "@/lib/constants";

/** Admin-tilgang styres av ADMIN_EMAILS (komma-separert liste). */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export type AdminMetrics = {
  users: number;
  byTier: Record<Plan, number>;
  mrrNok: number;
  properties: number;
  bookings: number;
  commissionTotal: number;
  commissionPending: number;
  commissionPaid: number;
};

type UserRow = { plan: Plan; extra_properties_count: number | null };
type CommissionRow = { commission_amount: number | null; status: string };

/** Aggregerer plattform-tall på tvers av alle brukere (service role). */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = createAdminClient();

  const { data: usersData } = await supabase
    .from("users")
    .select("plan,extra_properties_count");
  const users = (usersData ?? []) as UserRow[];

  const byTier: Record<Plan, number> = {
    gratis: 0,
    basis: 0,
    pluss: 0,
    premium: 0,
  };
  let mrrNok = 0;
  for (const u of users) {
    const plan = (u.plan ?? "gratis") as Plan;
    byTier[plan] = (byTier[plan] ?? 0) + 1;
    mrrNok += PLANS[plan]?.priceNok ?? 0;
    if (plan === "premium") {
      mrrNok += (u.extra_properties_count ?? 0) * EXTRA_PROPERTY_PRICE_NOK;
    }
  }

  const { count: properties } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true });
  const { count: bookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true });

  const { data: commData } = await supabase
    .from("commissions")
    .select("commission_amount,status");
  const commissions = (commData ?? []) as CommissionRow[];
  const commissionTotal = commissions.reduce(
    (s, c) => s + (Number(c.commission_amount) || 0),
    0,
  );
  const commissionPaid = commissions
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);

  return {
    users: users.length,
    byTier,
    mrrNok,
    properties: properties ?? 0,
    bookings: bookings ?? 0,
    commissionTotal,
    commissionPending: commissionTotal - commissionPaid,
    commissionPaid,
  };
}

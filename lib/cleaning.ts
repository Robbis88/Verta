import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type ScanClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

/**
 * Oppretter turnover-rengjøringsoppgaver på utsjekksdatoen for kommende,
 * bekreftede bookinger. Idempotent: én oppgave per booking.
 */
async function generateWith(supabase: ScanClient): Promise<{ created: number }> {
  const today = isoDay(new Date());
  const { data: properties } = await supabase.from("properties").select("id");
  let created = 0;

  for (const p of (properties ?? []) as { id: string }[]) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id,check_out")
      .eq("property_id", p.id)
      .neq("status", "cancelled")
      .gte("check_out", today);
    const list = (bookings ?? []) as { id: string; check_out: string }[];
    if (list.length === 0) continue;

    const { data: existing } = await supabase
      .from("cleaning_tasks")
      .select("booking_id")
      .eq("property_id", p.id)
      .not("booking_id", "is", null);
    const have = new Set(
      ((existing ?? []) as { booking_id: string }[]).map((e) => e.booking_id),
    );

    const rows = list
      .filter((b) => !have.has(b.id))
      .map((b) => ({
        property_id: p.id,
        booking_id: b.id,
        task_date: b.check_out,
        type: "turnover",
        status: "pending",
      }));
    if (rows.length > 0) {
      await supabase.from("cleaning_tasks").insert(rows);
      created += rows.length;
    }
  }
  return { created };
}

/** For innlogget eier (RLS gir kun egne eiendommer). */
export async function generateTasksForUser(): Promise<{ created: number }> {
  return generateWith(await createClient());
}

/** For alle eiendommer (cron, admin-klient). */
export async function generateTasksForAll(): Promise<{ created: number }> {
  return generateWith(createAdminClient());
}

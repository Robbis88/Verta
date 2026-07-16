import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lagrer et lokalt kritisk varsel som vises i dashbordet til det kvitteres bort.
 * property_id satt → eier (+ admin) ser det; null → kun admin (plattform-nivå).
 * Svelger alle feil — et varsel skal aldri kunne velte flyten som utløste det.
 */
export async function recordCriticalAlert(a: {
  kind: "refund_failed" | "orphan_payment";
  title: string;
  details?: Record<string, unknown>;
  propertyId?: string | null;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("critical_alerts").insert({
      kind: a.kind,
      title: a.title,
      details: a.details ?? {},
      property_id: a.propertyId ?? null,
    });
  } catch {
    // stille — logging skal aldri kunne velte produktet
  }
}

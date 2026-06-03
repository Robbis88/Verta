import { createAdminClient } from "@/lib/supabase/admin";

type AuditSeverity = "info" | "warning" | "security";

/**
 * Skriver en rad til audit_log. Bruker admin-klienten (service role) slik at
 * loggen er append-only fra appens side og ikke avhenger av RLS.
 * Feiler stille (logger til konsoll) — audit skal aldri velte en handling.
 */
export async function logAudit(entry: {
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  changes?: unknown;
  severity?: AuditSeverity;
  ip_address?: string;
}) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_log").insert({
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type ?? null,
      resource_id: entry.resource_id ?? null,
      changes: entry.changes ?? null,
      severity: entry.severity ?? "info",
      ip_address: entry.ip_address ?? null,
    });
    if (error) console.error("audit log failed:", error.message);
  } catch (err) {
    console.error("audit log threw:", err);
  }
}

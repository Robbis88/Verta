import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TwoFactor } from "@/components/security/two-factor";
import { SetPassword } from "@/components/security/set-password";
import {
  Beskjed,
  Flate,
  Handling,
  Liste,
  Rad,
  Side,
  Situasjon,
  Tomt,
} from "@/components/hus";

/**
 * Sikkerhet — modul 8. Kun presentasjon; samme spørring og samme filter
 * (?severity=…).
 */

type LogEntry = {
  id: string;
  action: string;
  resource_type: string | null;
  severity: string;
  created_at: string;
};

const SEVERITIES = [
  ["", "Alle"],
  ["info", "Info"],
  ["warning", "Advarsel"],
  ["security", "Sikkerhet"],
] as const;

const SEVERITY_TONE: Record<string, "ro" | "obs" | "kritisk"> = {
  security: "kritisk",
  warning: "obs",
  info: "ro",
};

export default async function SikkerhetPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; mfa?: string }>;
}) {
  await requireUser();
  const { severity, mfa } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("id,action,resource_type,severity,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (severity) query = query.eq("severity", severity);
  const { data } = await query;
  const log = (data ?? []) as LogEntry[];

  return (
    <Side>
      <Situasjon
        merke="Sikkerhet"
        tittel="Ingen andre skal komme inn i huset ditt."
        under="Tofaktor-autentisering og en logg over alt som er gjort på kontoen."
      />

      <Flate
        tittel="Passord"
        hva="Passordet du logger inn med. Minst åtte tegn."
      >
        <SetPassword />
      </Flate>

      <Flate
        tittel="Tofaktor (2FA)"
        hva="En engangskode fra telefonen i tillegg til passordet."
      >
        <div className="flex flex-col gap-4">
          {mfa === "required" && (
            <Beskjed tone="obs">
              Administratorkontoer må ha tofaktor aktivert. Aktiver det under for
              å få tilgang til admin-området.
            </Beskjed>
          )}
          <TwoFactor />
        </div>
      </Flate>

      <Flate
        tittel="Revisjonslogg"
        hva="De 50 siste hendelsene på kontoen din."
        handling={
          <div className="flex flex-wrap gap-1">
            {SEVERITIES.map(([v, l]) => (
              <Handling
                key={v || "alle"}
                href={
                  v ? `/dashboard/sikkerhet?severity=${v}` : "/dashboard/sikkerhet"
                }
                vekt={(severity ?? "") === v ? "stille" : "naken"}
              >
                {l}
              </Handling>
            ))}
          </div>
        }
      >
        {log.length === 0 ? (
          <Tomt
            tittel="Ingen hendelser."
            hva="Her dukker innlogginger, endringer og sikkerhetsvarsler opp."
          />
        ) : (
          <Liste>
            {log.map((e) => (
              <Rad
                key={e.id}
                nar={new Date(e.created_at).toLocaleString("nb-NO", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
                hva={e.action}
                detalj={e.resource_type ?? undefined}
                verdi={e.severity}
                tone={SEVERITY_TONE[e.severity] ?? "ro"}
              />
            ))}
          </Liste>
        )}
      </Flate>
    </Side>
  );
}

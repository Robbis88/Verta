import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TwoFactor } from "@/components/security/two-factor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

const SEVERITY_STYLE: Record<string, string> = {
  security: "text-red-600",
  warning: "text-amber-600",
  info: "text-muted-foreground",
};

export default async function SikkerhetPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string }>;
}) {
  await requireUser();
  const { severity } = await searchParams;
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Sikkerhet</h1>
        <p className="text-sm text-muted-foreground">
          Tofaktor-autentisering og en logg over viktige handlinger på kontoen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tofaktor-autentisering (2FA)</CardTitle>
        </CardHeader>
        <CardContent>
          <TwoFactor />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Revisjonslogg</CardTitle>
          <div className="flex gap-1 text-xs">
            {SEVERITIES.map(([v, l]) => (
              <Link
                key={v || "all"}
                href={v ? `/dashboard/sikkerhet?severity=${v}` : "/dashboard/sikkerhet"}
                className={`rounded px-2 py-1 ${
                  (severity ?? "") === v
                    ? "bg-navy text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen hendelser.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {log.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="flex-1 font-mono text-xs">{e.action}</span>
                  <span className={`text-xs ${SEVERITY_STYLE[e.severity] ?? ""}`}>
                    {e.severity}
                  </span>
                  <span className="w-32 text-right text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("nb-NO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

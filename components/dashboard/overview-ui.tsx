import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Merkefarget nøkkeltall-kort med ikon-brikke og valgfri trend — samme uttrykk
 * som landingssiden (gull ikon-chip, navy verdi, grønn/rød trend).
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  trendTone = "up",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendTone?: "up" | "down" | "muted";
}) {
  const trendClass =
    trendTone === "up"
      ? "text-emerald-600"
      : trendTone === "down"
        ? "text-red-600"
        : "text-muted-foreground";
  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-[0_8px_30px_rgba(8,27,51,0.06)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink/60">
          {label}
        </span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-gold/15 text-gold">
          <Icon className="size-4" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-navy">{value}</p>
      {trend && (
        <p className={cn("mt-1 text-xs font-medium", trendClass)}>{trend}</p>
      )}
    </div>
  );
}

/**
 * Vertikalt stolpediagram med gull-gradient, likt grafen i landingssidens
 * dashboard-forhåndsvisning. Tom måned vises som en lav «rest»-stolpe.
 */
export function MonthChart({
  values,
  labels,
  format,
}: {
  values: number[];
  labels: string[];
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...values);
  return (
    <div>
      {/* Stolpene er direkte barn av en boks med fast høyde, slik at
          prosent-høyden faktisk har noe å regne mot (jf. DashboardPreview). */}
      <div className="flex h-40 items-end gap-1.5">
        {values.map((v, i) => {
          const pct = v > 0 ? Math.max(6, Math.round((v / max) * 100)) : 2;
          return (
            <div
              key={i}
              title={v > 0 ? format(v) : undefined}
              className={cn(
                "flex-1 rounded-t transition-opacity hover:opacity-80",
                v > 0 ? "bg-gradient-to-t from-gold/40 to-gold" : "bg-cloud",
              )}
              style={{ height: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-ink/50">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Seksjonskort med tittel — hvit, avrundet, myk skygge (landingsstil). */
export function PanelCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-[0_8px_30px_rgba(8,27,51,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

/**
 * Rolig tallrad — fire nøkkeltall i ÉN flate i stedet for fire bokser med
 * ikoner. Brukes på oversikten, der poenget er å lese tallene raskt, ikke å
 * telle kort. (KpiCard beholdes uendret for Utgifter, Skatt og Provisjon.)
 */
export function TallRad({
  tall,
}: {
  tall: {
    label: string;
    value: string;
    trend?: string;
    trendTone?: "up" | "down" | "muted";
  }[];
}) {
  return (
    <div className="grid grid-cols-2 divide-hairline rounded-2xl border border-hairline bg-white shadow-[0_8px_30px_rgba(8,27,51,0.06)] sm:grid-cols-4 sm:divide-x">
      {tall.map((t) => (
        <div key={t.label} className="px-5 py-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
            {t.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-navy">
            {t.value}
          </p>
          {t.trend && (
            <p
              className={cn(
                "mt-1 text-xs",
                t.trendTone === "up"
                  ? "text-emerald-600"
                  : t.trendTone === "down"
                    ? "text-red-600"
                    : "text-ink/50",
              )}
            >
              {t.trend}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

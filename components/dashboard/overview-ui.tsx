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
    <div className="flex h-40 items-end gap-1.5">
      {values.map((v, i) => {
        const pct = Math.max(4, Math.round((v / max) * 100));
        return (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center gap-1.5"
          >
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-gradient-to-t from-gold/40 to-gold transition-opacity group-hover:opacity-80"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-ink/50">{labels[i]}</span>
            {v > 0 && (
              <span className="pointer-events-none absolute -top-6 hidden whitespace-nowrap rounded bg-navy px-2 py-1 text-[10px] font-medium text-white group-hover:block">
                {format(v)}
              </span>
            )}
          </div>
        );
      })}
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

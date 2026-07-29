import { cn } from "@/lib/utils";

/**
 * Inntektsgrafen. Eneste som er igjen her etter modul 10 — TallRad, PanelCard
 * og KpiCard er erstattet av husets TallRekke og Flate.
 *
 * Grafen brukes to steder med hver sin flate: oversikten i huset (mørk) og
 * admin/inntekt (lys, utenfor refaktoren). Derfor `tone` — ikke to nesten like
 * komponenter.
 */
export function MonthChart({
  values,
  labels,
  format,
  tone = "lys",
}: {
  values: number[];
  labels: string[];
  format: (n: number) => string;
  /** «lys» = admin-flaten (uendret). «hus» = husets mørke flate. */
  tone?: "lys" | "hus";
}) {
  const max = Math.max(1, ...values);
  const tom = tone === "hus" ? "bg-white/[0.06]" : "bg-cloud";
  const fylt =
    tone === "hus"
      ? "bg-gradient-to-t from-hus-gull/40 to-hus-gull"
      : "bg-gradient-to-t from-gold/40 to-gold";
  const merke = tone === "hus" ? "text-hus-svak" : "text-ink/50";

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
                v > 0 ? fylt : tom,
              )}
              style={{ height: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {labels.map((l, i) => (
          <span key={i} className={cn("flex-1 text-center text-[10px]", merke)}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

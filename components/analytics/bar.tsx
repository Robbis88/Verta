export function Bar({
  label,
  value,
  max,
  display,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 rounded bg-muted">
        <div
          className="h-2 rounded bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-24 shrink-0 text-right tabular-nums">{display}</span>
    </div>
  );
}

import Link from "next/link";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Vises når brukeren ikke har noen eiendom å vise økonomi for. */
export function EmptyOkonomi() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingen eiendom ennå</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          Legg til en eiendom for å se økonomien.
        </p>
        <Button asChild>
          <Link href="/dashboard/properties/new">Legg til eiendom</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Stor, tydelig nøkkeltall-kort — hjertet i det premium uttrykket. */
export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "positive" | "negative" | "gold";
}) {
  const valueTone =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
        ? "text-red-600"
        : tone === "gold"
          ? "text-gold"
          : "text-navy";
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={cn("text-2xl font-semibold tabular-nums", valueTone)}>
          {value}
        </span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </CardContent>
    </Card>
  );
}

/** Rad med etikett til venstre og beløp (høyrejustert, tabular) til høyre. */
export function MoneyRow({
  label,
  value,
  strong = false,
  muted = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 text-sm",
        strong && "border-t border-hairline pt-3 font-semibold text-navy",
        muted && "text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/** Enkel horisontal andels-/fremdriftsbar. */
export function MiniBar({ pct, tone = "gold" }: { pct: number; tone?: "gold" | "navy" }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", tone === "gold" ? "bg-gold" : "bg-navy")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

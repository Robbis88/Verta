import { cn } from "@/lib/utils";
import { Flate, Rad, Tomt } from "@/components/hus";

/**
 * Økonomi-modulens byggeklosser — modul 6 i UI-refaktoren.
 *
 * Disse var et eget lite designsystem ved siden av husets (egne kort, egne
 * farger, egen tone-skala). Nå er de tynne innpakninger over husets primitiver,
 * med samme API som før. Derfor trengte ingen av de seks økonomi-sidene å
 * skrive om markupen sin — de arvet uttrykket.
 *
 * Beholdes som eget navn fordi kallstedene er mange og API-et er godt; det er
 * implementasjonen som var problemet, ikke grensesnittet.
 */

/** Vises når brukeren ikke har noen eiendom å vise økonomi for. */
export function EmptyOkonomi() {
  return (
    <Flate>
      <Tomt
        tittel="Ingen eiendom ennå."
        hva="Verta regner ut verdi, lån, egenkapital og kontantstrøm så snart du har lagt inn boligen din."
        knappTekst="Legg til eiendom"
        knappHref="/dashboard/properties/new"
      />
    </Flate>
  );
}

/** Stort nøkkeltall. Samme API som før; nå i husets flate og farger. */
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
  const farge =
    tone === "positive"
      ? "text-hus-god"
      : tone === "negative"
        ? "text-hus-kritisk"
        : tone === "gold"
          ? "text-hus-gull-lys"
          : "text-hus-blekk";
  return (
    <div className="rounded-2xl border border-hus-linje bg-[linear-gradient(180deg,rgba(245,247,250,0.045),rgba(245,247,250,0.02))] px-5 py-6">
      <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-hus-svak">
        {label}
      </span>
      <span
        className={cn("mt-2 block text-2xl font-light tabular-nums sm:text-3xl", farge)}
      >
        {value}
      </span>
      {sub && <span className="mt-1 block text-xs text-hus-svak">{sub}</span>}
    </div>
  );
}

/** Rad med etikett til venstre og beløp til høyre. Bygger på husets Rad. */
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
    <Rad
      hva={label}
      verdi={value}
      sterk={strong}
      tone={muted ? "ro" : strong ? "gull" : "ro"}
    />
  );
}

/** Enkel horisontal andels-/fremdriftsbar. */
export function MiniBar({
  pct,
  tone = "gold",
}: {
  pct: number;
  tone?: "gold" | "navy";
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={cn(
          "h-full rounded-full",
          tone === "gold" ? "bg-hus-gull" : "bg-hus-dempet",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

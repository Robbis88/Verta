import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * HUSET — designsystemet for hele det innloggede produktet.
 *
 * Sju primitiver. Dette er de ENESTE lovlige byggeklossene på en side i huset.
 * Farger, avstand og bevegelse kommer fra tokens i app/globals.css; ingen side
 * setter farge selv. Ser du en hex-kode eller et rått <div className="rounded-2xl
 * border bg-white"> i en side, er den ikke konvertert ennå.
 *
 *   Side        — bredden og pusten. Flaten selv ligger i dashboard/layout.tsx.
 *   Situasjon   — åpningen. Hva er tilfellet nå, før noen data vises.
 *   Tall        — et tall som betyr noe, med én linje kontekst.
 *   Flate       — en rolig seksjon med overskrift.
 *   Rad         — én linje i en liste: når, hva, hvor mye, handling.
 *   Handling    — lenke eller knapp. To vekter: gull og stille.
 *   Tomt        — ingenting her ennå, og én vei videre.
 *
 * Alle er server-komponenter (ingen "use client"), så de kan brukes direkte i
 * sider som henter data. Interaktivitet legges i egne klientkomponenter som
 * plasseres INNI disse.
 */

// ---------------------------------------------------------------------------
// Side
//
// Etter modul 11 setter denne KUN bredde og pust. Bakgrunn, blekkfarge og
// takhøyde ligger i app/dashboard/layout.tsx, så flaten er sammenhengende
// under hele dashbordet i stedet for å bli lagt oppå per side.
// ---------------------------------------------------------------------------

export function Side({
  children,
  bred = false,
}: {
  children: ReactNode;
  /** Bred flate for tunge tabeller og kalendere. Standard er lesbar bredde. */
  bred?: boolean;
}) {
  return (
    <div className="px-5 py-10 sm:px-8 lg:px-10">
      <div
        className={cn(
          "relative mx-auto flex w-full flex-col gap-8",
          bred ? "max-w-6xl" : "max-w-3xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Situasjon — åpningen. ALDRI en tabell først.
// ---------------------------------------------------------------------------

export function Situasjon({
  merke,
  tittel,
  under,
  handling,
}: {
  /** Kort ord over overskriften: «Utgifter», «Skatt», «Rengjøring». */
  merke: string;
  /** Hva som ER tilfellet nå — en setning, ikke et modulnavn. */
  tittel: string;
  /** Én linje til, hvis den tilfører noe. */
  under?: ReactNode;
  /** Filtre eller primærhandling, til høyre på store skjermer. */
  handling?: ReactNode;
}) {
  return (
    <header className="hus-stig flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-hus-gull">
          {merke}
        </p>
        <h1 className="mt-3 text-balance text-3xl font-light leading-tight text-hus-blekk sm:text-4xl">
          {tittel}
        </h1>
        {under && (
          <p className="mt-3 max-w-prose text-balance text-sm leading-relaxed text-hus-dempet">
            {under}
          </p>
        )}
      </div>
      {handling && <div className="flex shrink-0 flex-wrap gap-2">{handling}</div>}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Tall
// ---------------------------------------------------------------------------

export function TallRekke({ children }: { children: ReactNode }) {
  return (
    <div className="hus-stig grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hus-linje bg-hus-linje-svak sm:grid-cols-4">
      {children}
    </div>
  );
}

export function Tall({
  verdi,
  navn,
  tone = "ro",
}: {
  verdi: string;
  navn: string;
  /** ro = hvit, gull = penger, obs/kritisk = krever noe. */
  tone?: "ro" | "gull" | "obs" | "kritisk";
}) {
  const farge =
    tone === "gull"
      ? "text-hus-gull-lys"
      : tone === "obs"
        ? "text-hus-obs"
        : tone === "kritisk"
          ? "text-hus-kritisk"
          : "text-hus-blekk";
  return (
    <div className="bg-hus-flate px-5 py-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-hus-svak">
        {navn}
      </p>
      <p className={cn("mt-2 text-2xl font-light tabular-nums sm:text-3xl", farge)}>
        {verdi}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flate — seksjon
// ---------------------------------------------------------------------------

export function Flate({
  tittel,
  hva,
  handling,
  children,
}: {
  tittel?: string;
  /** Én linje som forklarer seksjonen for en som aldri har sett den. */
  hva?: string;
  handling?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="hus-seksjon hus-stig rounded-2xl border border-hus-linje bg-[linear-gradient(180deg,rgba(245,247,250,0.045),rgba(245,247,250,0.02))] p-5 sm:p-6">
      {(tittel || handling) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {tittel && (
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-hus-gull">
                {tittel}
              </h2>
            )}
            {hva && <p className="mt-1.5 text-sm text-hus-svak">{hva}</p>}
          </div>
          {handling && <div className="shrink-0">{handling}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Rad — én linje i en liste
// ---------------------------------------------------------------------------

export function Liste({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col">{children}</ul>;
}

export function Rad({
  nar,
  hva,
  detalj,
  verdi,
  tone = "ro",
  sterk = false,
  handling,
  mer,
  href,
}: {
  /** Venstre kolonne: dato eller kort merkelapp. */
  nar?: string;
  /** Hovedteksten. */
  hva: ReactNode;
  /** Én linje under, dempet. */
  detalj?: ReactNode;
  /** Høyrestilt tall. */
  verdi?: string;
  tone?: "ro" | "gull" | "obs" | "kritisk";
  /** Sumlinje — tyngre skrift og en tydeligere strek over. */
  sterk?: boolean;
  /** Knapp/skjema helt til høyre. */
  handling?: ReactNode;
  /** Ekstra innhold i full bredde under raden (bilder, tidspunkt, notat). */
  mer?: ReactNode;
  /** Gjør hele raden klikkbar. */
  href?: string;
}) {
  const farge =
    tone === "gull"
      ? "text-hus-gull-lys"
      : tone === "obs"
        ? "text-hus-obs"
        : tone === "kritisk"
          ? "text-hus-kritisk"
          : "text-hus-blekk";

  const innhold = (
    <>
      {nar && (
        <span className="w-24 shrink-0 text-xs text-hus-svak tabular-nums">{nar}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm text-hus-blekk", sterk && "font-semibold")}>
          {hva}
        </span>
        {detalj && (
          <span className="mt-0.5 block truncate text-xs text-hus-svak">{detalj}</span>
        )}
      </span>
      {verdi && (
        <span className={cn("shrink-0 text-sm tabular-nums", sterk && "font-semibold", farge)}>
          {verdi}
        </span>
      )}
    </>
  );

  return (
    <li
      className={cn(
        "border-b border-hus-linje-svak py-3 last:border-b-0",
        sterk && "border-t border-t-hus-linje pt-4",
      )}
    >
      <div className="flex items-center gap-4">
      {href ? (
        <Link
          href={href}
          className="-mx-2 flex min-w-0 flex-1 items-center gap-4 rounded-lg px-2 py-1 transition-colors hover:bg-white/[0.03]"
        >
          {innhold}
        </Link>
      ) : (
        innhold
      )}
        {handling && <span className="shrink-0">{handling}</span>}
      </div>
      {mer && <div className="mt-2 pl-0 sm:pl-28">{mer}</div>}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Handling — lenke eller knapp
// ---------------------------------------------------------------------------

const HANDLING_BASE =
  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm no-underline transition-all duration-300";

const HANDLING_VEKT = {
  gull: "bg-[linear-gradient(180deg,var(--color-hus-gull-lys),var(--color-hus-gull))] font-semibold text-hus-flate hover:-translate-y-px",
  stille:
    "border border-hus-linje text-hus-dempet hover:border-hus-linje-sterk hover:text-hus-blekk",
  naken: "px-2 py-1 text-hus-svak hover:text-hus-gull",
} as const;

export function Handling({
  href,
  vekt = "stille",
  children,
  type,
  disabled,
  onClick,
  className,
  nyFane = false,
}: {
  /** Lenke. Uten href blir det en knapp (for <form action=…>). */
  href?: string;
  vekt?: keyof typeof HANDLING_VEKT;
  children: ReactNode;
  type?: "submit" | "button";
  /** Sperrer knappen — f.eks. mens et skjema sendes, så det ikke dobbelsendes. */
  disabled?: boolean;
  /** Kun fra klientkomponenter (f.eks. window.print()). */
  onClick?: () => void;
  className?: string;
  /** Åpner i ny fane — for nedlastinger og eksterne portaler. */
  nyFane?: boolean;
}) {
  const klasse = cn(HANDLING_BASE, HANDLING_VEKT[vekt], className);
  if (href) {
    return (
      <Link
        href={href}
        className={klasse}
        target={nyFane ? "_blank" : undefined}
        rel={nyFane ? "noopener noreferrer" : undefined}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type ?? "button"}
      disabled={disabled}
      onClick={onClick}
      className={cn(klasse, "cursor-pointer disabled:cursor-default disabled:opacity-40")}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tomt — aldri en blindvei
// ---------------------------------------------------------------------------

export function Tomt({
  tittel,
  hva,
  knappTekst,
  knappHref,
}: {
  tittel: string;
  /** Hvorfor det er verdt å fylle den. */
  hva?: string;
  knappTekst?: string;
  knappHref?: string;
}) {
  return (
    <div className="py-12 text-center">
      <p className="text-balance text-lg font-light text-hus-blekk">{tittel}</p>
      {hva && (
        <p className="mx-auto mt-2 max-w-sm text-balance text-sm text-hus-dempet">
          {hva}
        </p>
      )}
      {knappTekst && knappHref && (
        <div className="mt-6">
          <Handling href={knappHref} vekt="gull">
            {knappTekst}
          </Handling>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Felt — skjema i husets språk
//
// Wrapper vanlige <input>/<select>/<textarea>. `name` går rett gjennom, så
// server actions ser nøyaktig samme FormData som før. Egne primitiver fordi
// components/ui/* deles med login, registrer, onboarding og admin — de skal
// ikke endres av denne refaktoren.
// ---------------------------------------------------------------------------

/** Feltstilen, eksportert for de få stedene et rått <select> må stå inline. */
export const feltKlasse =
  "h-11 w-full rounded-xl border border-hus-linje bg-white/[0.04] px-4 text-sm text-hus-blekk outline-none transition-colors placeholder:text-hus-hvisk focus:border-hus-linje-sterk focus:bg-white/[0.07]";

function Merkelapp({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[11px] font-medium uppercase tracking-[0.14em] text-hus-svak"
    >
      {children}
    </label>
  );
}

function Feilmelding({ tekst }: { tekst?: string }) {
  if (!tekst) return null;
  return <p className="text-xs text-hus-kritisk">{tekst}</p>;
}

export function Felt({
  navn,
  merke,
  feil,
  ...rest
}: {
  /** name-attributtet. Må være identisk med det server action forventer. */
  navn: string;
  merke: string;
  feil?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "className">) {
  return (
    <div className="flex flex-col gap-2">
      <Merkelapp htmlFor={navn}>{merke}</Merkelapp>
      <input id={navn} name={navn} className={feltKlasse} {...rest} />
      <Feilmelding tekst={feil} />
    </div>
  );
}

export function Velg({
  navn,
  merke,
  feil,
  valg,
  ...rest
}: {
  navn: string;
  merke: string;
  feil?: string;
  valg: { verdi: string; tekst: string }[];
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name" | "children">) {
  return (
    <div className="flex flex-col gap-2">
      <Merkelapp htmlFor={navn}>{merke}</Merkelapp>
      <select id={navn} name={navn} className={cn(feltKlasse, "cursor-pointer")} {...rest}>
        {valg.map((v) => (
          <option key={v.verdi} value={v.verdi} className="bg-hus-hev text-hus-blekk">
            {v.tekst}
          </option>
        ))}
      </select>
      <Feilmelding tekst={feil} />
    </div>
  );
}

export function Omrade({
  navn,
  merke,
  feil,
  ...rest
}: {
  navn: string;
  merke: string;
  feil?: string;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  return (
    <div className="flex flex-col gap-2">
      <Merkelapp htmlFor={navn}>{merke}</Merkelapp>
      <textarea
        id={navn}
        name={navn}
        className={cn(feltKlasse, "h-auto min-h-24 py-3 leading-relaxed")}
        {...rest}
      />
      <Feilmelding tekst={feil} />
    </div>
  );
}

/** Kvittering under et skjema: feil i rødt, suksess i grønt. */
export function Kvittering({ feil, ok }: { feil?: string; ok?: string }) {
  if (feil) return <p className="text-sm text-hus-kritisk">{feil}</p>;
  if (ok) return <p className="text-sm text-hus-god">{ok}</p>;
  return null;
}

// ---------------------------------------------------------------------------
// Merke — kort status. Aldri en farget boks; en rolig pille.
// ---------------------------------------------------------------------------

export function Merke({
  children,
  tone = "ro",
}: {
  children: ReactNode;
  tone?: "ro" | "gull" | "obs" | "kritisk" | "god";
}) {
  const stil =
    tone === "gull"
      ? "border-hus-linje-sterk text-hus-gull-lys"
      : tone === "obs"
        ? "border-hus-obs/40 text-hus-obs"
        : tone === "kritisk"
          ? "border-hus-kritisk/40 text-hus-kritisk"
          : tone === "god"
            ? "border-hus-god/40 text-hus-god"
            : "border-hus-linje text-hus-dempet";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        stil,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Beskjed — kvittering etter en handling. Rolig, aldri en skrikende boks.
// ---------------------------------------------------------------------------

export function Beskjed({
  children,
  tone = "god",
}: {
  children: ReactNode;
  tone?: "god" | "obs" | "kritisk";
}) {
  const stil =
    tone === "kritisk"
      ? "border-l-hus-kritisk text-hus-kritisk"
      : tone === "obs"
        ? "border-l-hus-obs text-hus-obs"
        : "border-l-hus-god text-hus-god";
  return (
    <p
      className={cn(
        "hus-stig rounded-r-xl border-l-2 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed",
        stil,
      )}
    >
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Kort — en flate INNI en Flate. For lister der hver rad har eget skjema
// (saker, forespørsler). Finnes så ikke sidene finner opp egne bakgrunner.
// ---------------------------------------------------------------------------

export function Kort({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-hus-linje bg-white/[0.02] p-4">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabell — for ekte tabelldata (flere kolonner som skal sammenlignes).
// Ruller vannrett i sin egen boks, så siden aldri ruller sidelengs.
// ---------------------------------------------------------------------------

export function Tabell({
  kolonner,
  rader,
  sisteSterk = false,
}: {
  /** Overskrifter. Alt utenom første kolonne høyrestilles. */
  kolonner: string[];
  /** Radene, i samme rekkefølge som kolonnene. */
  rader: ReactNode[][];
  /** Siste rad er en sum — tyngre skrift og strek over. */
  sisteSterk?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr className="border-b border-hus-linje">
            {kolonner.map((k, i) => (
              <th
                key={k}
                className={cn(
                  "py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-hus-svak",
                  i === 0 ? "text-left" : "text-right",
                )}
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rader.map((rad, ri) => {
            const sum = sisteSterk && ri === rader.length - 1;
            return (
              <tr
                key={ri}
                className={cn(
                  "border-b border-hus-linje-svak last:border-b-0",
                  sum && "border-t border-t-hus-linje",
                )}
              >
                {rad.map((celle, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "py-2.5",
                      ci === 0
                        ? "text-left text-hus-blekk"
                        : "text-right tabular-nums text-hus-dempet",
                      sum && "py-3.5 font-semibold text-hus-blekk",
                    )}
                  >
                    {celle}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

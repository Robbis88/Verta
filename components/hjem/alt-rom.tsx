"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * ALT — hele systemet på én skjerm.
 *
 * Dette er den gamle toppmenyen med nedtrekk. Ingenting er fjernet — modulene
 * er samlet, gruppert og lagt bak ÉN dør, så de ikke står og roper mens du
 * jobber. Søkefeltet gjør at du aldri må lete: skriv «skatt», «vask», «lås»,
 * og du er der.
 */

type Item = { label: string; href: string; hint: string };
type Gruppe = { tittel: string; hva: string; items: Item[] };

export function AltRom({ grupper }: { grupper: Gruppe[] }) {
  const [sok, setSok] = useState("");

  const filtrert = useMemo(() => {
    const q = sok.trim().toLowerCase();
    if (!q) return grupper;
    return grupper
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [grupper, sok]);

  const antall = grupper.reduce((n, g) => n + g.items.length, 0);
  const treff = filtrert.reduce((n, g) => n + g.items.length, 0);

  return (
    <main className="vh-alt">
      <div className="vh-alt-lys" aria-hidden="true" />

      <header className="vh-alt-topp">
        <p className="vh-alt-merke">Alt</p>
        <h1 className="vh-alt-tittel">Hele systemet, {antall} moduler.</h1>
        <p className="vh-alt-under">
          Ingenting er borte — det står bare ikke i veien. Skriv for å finne noe.
        </p>
        <input
          value={sok}
          onChange={(e) => setSok(e.target.value)}
          placeholder="Søk: skatt, vask, lås, gjest, utgift …"
          aria-label="Søk i systemet"
          className="vh-alt-sok"
          autoComplete="off"
        />
      </header>

      {sok.trim() && treff === 0 ? (
        <p className="vh-alt-tomt">
          Ingen modul heter det. Prøv <strong>Ord</strong> i stedet — der kan du
          spørre Vera med dine egne ord.
        </p>
      ) : (
        <div className="vh-alt-grupper">
          {filtrert.map((g) => (
            <section key={g.tittel} className="vh-alt-gruppe">
              <header className="vh-alt-ghode">
                <h2 className="vh-alt-gtittel">{g.tittel}</h2>
                <p className="vh-alt-ghva">{g.hva}</p>
              </header>
              <ul className="vh-alt-liste">
                {g.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className="vh-alt-lenke">
                      <span className="vh-alt-label">{i.label}</span>
                      <span className="vh-alt-hint">{i.hint}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <AltStil />
    </main>
  );
}

function AltStil() {
  return (
    <style>{`
.vh-alt{position:relative;min-height:100dvh;background:#04111f;color:#f5f7fa;overflow-x:hidden;
  font-family:var(--font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif);
  padding:clamp(30px,6vh,64px) clamp(20px,5vw,60px) 132px}
.vh-alt-lys{position:fixed;inset:0;pointer-events:none;background:
  radial-gradient(110% 70% at 50% -10%,rgba(216,166,106,.12),transparent 60%),
  linear-gradient(180deg,#08203a 0%,#04111f 55%)}
.vh-alt>*:not(.vh-alt-lys){position:relative;z-index:1}

.vh-alt-topp{max-width:640px;margin:0 auto;text-align:center}
.vh-alt-merke{font-size:11px;font-weight:600;letter-spacing:.34em;text-transform:uppercase;
  color:#d8a66a;padding-left:.34em}
.vh-alt-tittel{margin-top:14px;font-size:clamp(26px,4.4vw,42px);font-weight:300;line-height:1.1;
  color:#f5f7fa;text-wrap:balance}
.vh-alt-under{margin-top:12px;font-size:15px;color:#93a3b8;text-wrap:balance}
.vh-alt-sok{margin-top:24px;width:100%;padding:14px 20px;border-radius:999px;
  background:rgba(245,247,250,.05);border:1px solid rgba(216,166,106,.18);color:#f5f7fa;font:inherit;
  font-size:15px;outline:none;text-align:center;transition:border-color .4s,background .4s}
.vh-alt-sok::placeholder{color:#46566d}
.vh-alt-sok:focus{border-color:rgba(216,166,106,.55);background:rgba(245,247,250,.08)}

.vh-alt-grupper{max-width:1020px;margin:clamp(30px,5vh,54px) auto 0;display:grid;
  gap:clamp(22px,3vw,34px);grid-template-columns:repeat(auto-fit,minmax(268px,1fr))}
.vh-alt-ghode{padding-bottom:12px;border-bottom:1px solid rgba(216,166,106,.2)}
.vh-alt-gtittel{font-size:20px;font-weight:400;color:#f2c38b}
.vh-alt-ghva{margin-top:3px;font-size:12px;color:#6b7a8f}
.vh-alt-liste{list-style:none;margin:6px 0 0;padding:0}
.vh-alt-lenke{display:flex;flex-direction:column;gap:2px;padding:13px 6px;text-decoration:none;
  border-bottom:1px solid rgba(245,247,250,.055);border-radius:6px;
  transition:padding-left .4s,background .4s}
.vh-alt-lenke:hover{padding-left:12px;background:rgba(245,247,250,.035)}
.vh-alt-lenke:focus-visible{outline:1px solid #d8a66a;outline-offset:2px}
.vh-alt-label{font-size:15px;color:#f5f7fa}
.vh-alt-hint{font-size:12px;color:#6b7a8f;line-height:1.45}

.vh-alt-tomt{max-width:520px;margin:60px auto 0;text-align:center;font-size:16px;color:#93a3b8;
  line-height:1.7;text-wrap:balance}
.vh-alt-tomt strong{color:#d8a66a;font-weight:600}
`}</style>
  );
}

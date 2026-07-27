"use client";

import Link from "next/link";

import type { Biografi } from "@/lib/hus";

/** Etiketter for hendelsestypene. Ren presentasjon, derfor på klientsiden. */
const SLAG: Record<string, string> = {
  kjop: "Kjøp",
  oppussing: "Oppussing",
  vedlikehold: "Vedlikehold",
  finans: "Finans",
  verdi: "Verdi",
  utstyr: "Utstyr",
  reparasjon: "Reparert",
};

function slagTekst(slag: string): string {
  return SLAG[slag] ?? slag;
}

/**
 * HUSETS BIOGRAFI — det boligen har vært gjennom, år for år.
 *
 * Ikke en rapport. En historie: hva huset har tjent siden dag én, hvor mange
 * mennesker som har bodd her, hva som er pusset opp og reparert, og hva
 * gjestene har sagt. Skrevet av seg selv, av data som allerede lå der.
 *
 * Siden er laget for å skrives ut og gis videre den dagen boligen selges — en
 * dokumentert historikk er verdt penger for en kjøper. Utskrift gir hvitt
 * papir og svart tekst (se @media print).
 */

function kroner(n: number): string {
  return `${new Intl.NumberFormat("nb-NO").format(Math.round(n))} kr`;
}

function dagMnd(iso: string): string {
  return new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    })
    .replace(".", "");
}

export function HistorieRom({ bio }: { bio: Biografi }) {
  const husnavn = bio.boligNavn ?? "Boligen";
  const netto = bio.totalInntekt - bio.totalKostnad;
  const harHistorie = bio.ar.length > 0;

  return (
    <main className="vh-hist">
      <div className="vh-hist-lys" aria-hidden="true" />

      <header className="vh-hist-topp">
        <p className="vh-hist-merke">Husets historie</p>
        <h1 className="vh-hist-tittel">
          {harHistorie && bio.forsteAr
            ? `${husnavn} har vært i drift siden ${bio.forsteAr}.`
            : `${husnavn} har ikke rukket å få en historie ennå.`}
        </h1>
        {harHistorie ? (
          <p className="vh-hist-under">
            Alt under er skrevet av boligen selv, av det som allerede er
            registrert. Skriv det ut og gi det videre den dagen du selger — en
            dokumentert historikk er verdt penger for en kjøper.
          </p>
        ) : (
          <p className="vh-hist-under">
            Etter hvert som du registrerer bookinger, utgifter, oppussing og
            utstyr, skriver huset denne siden selv.
          </p>
        )}
      </header>

      {harHistorie && (
        <>
          <section className="vh-hist-sum" aria-label="Siden dag én">
            <Tall verdi={kroner(bio.totalInntekt)} navn="tjent siden dag én" stor />
            <Tall verdi={`${bio.totalGjester}`} navn="mennesker har bodd her" />
            <Tall verdi={`${bio.totalNetter}`} navn="netter med lys i vinduet" />
            {bio.totalKostnad > 0 && (
              <Tall
                verdi={kroner(netto)}
                navn="igjen etter kostnader"
                tone={netto < 0 ? "tap" : undefined}
              />
            )}
            {bio.snittRating !== null && (
              <Tall
                verdi={`${bio.snittRating.toString().replace(".", ",")} ★`}
                navn={`fra ${bio.antallAnmeldelser} gjester`}
              />
            )}
          </section>

          {bio.sitat && (
            <blockquote className="vh-sitat">
              <p className="vh-sitat-tekst">«{bio.sitat.tekst}»</p>
              <footer className="vh-sitat-navn">
                {bio.sitat.navn} · {bio.sitat.rating} av 5
              </footer>
            </blockquote>
          )}

          <div className="vh-tidslinje">
            {bio.ar.map((a) => (
              <section key={a.ar} className="vh-ar">
                <header className="vh-ar-hode">
                  <h2 className="vh-ar-tall">{a.ar}</h2>
                  <p className="vh-ar-sum">
                    {a.gjester > 0 && (
                      <>
                        {a.gjester} opphold · {a.netter} netter
                        {a.inntekt > 0 && <> · {kroner(a.inntekt)}</>}
                      </>
                    )}
                    {a.gjester === 0 && a.hendelser.length > 0 && "ingen gjester"}
                    {a.kostnad > 0 && (
                      <span className="vh-ar-kost"> · {kroner(a.kostnad)} i kostnader</span>
                    )}
                  </p>
                </header>

                {a.hendelser.length > 0 ? (
                  <ul className="vh-hendelser">
                    {a.hendelser.map((h) => (
                      <li key={h.id} className="vh-hendelse">
                        <span className="vh-hendelse-dato">{dagMnd(h.dato)}</span>
                        <span className="vh-hendelse-tekst">
                          <span className="vh-hendelse-slag">{slagTekst(h.slag)}</span>
                          {h.tittel}
                        </span>
                        {h.belop != null && h.belop > 0 && (
                          <span className="vh-hendelse-belop">{kroner(h.belop)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="vh-ar-stille">Et rolig år. Ingenting registrert.</p>
                )}
              </section>
            ))}
          </div>
        </>
      )}

      <div className="vh-hist-bunn no-print">
        <button
          type="button"
          onClick={() => window.print()}
          className="vh-hist-knapp vh-hist-knapp--gull"
        >
          Skriv ut historien
        </button>
        <Link href="/dashboard/okonomi/historikk" className="vh-hist-knapp">
          Legg til en hendelse
        </Link>
      </div>

      <HistorieStil />
    </main>
  );
}

function Tall({
  verdi,
  navn,
  stor,
  tone,
}: {
  verdi: string;
  navn: string;
  stor?: boolean;
  tone?: "tap";
}) {
  return (
    <div className="vh-sum-en">
      <span
        className={`vh-sum-verdi ${stor ? "vh-sum-verdi--stor" : ""} ${
          tone === "tap" ? "vh-sum-verdi--tap" : ""
        }`}
      >
        {verdi}
      </span>
      <span className="vh-sum-navn">{navn}</span>
    </div>
  );
}

function HistorieStil() {
  return (
    <style>{`
.vh-hist{position:relative;min-height:100dvh;background:#04111f;color:#f5f7fa;overflow-x:hidden;
  font-family:var(--font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif);
  padding:clamp(30px,6vh,64px) clamp(20px,5vw,60px) 132px}
.vh-hist-lys{position:fixed;inset:0;pointer-events:none;background:
  radial-gradient(110% 70% at 50% -10%,rgba(216,166,106,.14),transparent 60%),
  linear-gradient(180deg,#0a2038 0%,#04111f 58%)}
.vh-hist>*:not(.vh-hist-lys){position:relative;z-index:1}

.vh-hist-topp{max-width:720px;margin:0 auto;text-align:center}
.vh-hist-merke{font-size:11px;font-weight:600;letter-spacing:.34em;text-transform:uppercase;
  color:#d8a66a;padding-left:.34em}
.vh-hist-tittel{margin-top:14px;font-size:clamp(27px,4.6vw,44px);font-weight:300;line-height:1.1;
  color:#f5f7fa;text-wrap:balance}
.vh-hist-under{margin-top:14px;font-size:15px;line-height:1.7;color:#93a3b8;text-wrap:balance}

.vh-hist-sum{max-width:900px;margin:clamp(30px,5vh,52px) auto 0;display:flex;flex-wrap:wrap;
  justify-content:center;gap:clamp(20px,4vw,48px)}
.vh-sum-en{display:flex;flex-direction:column;align-items:center;gap:5px}
.vh-sum-verdi{font-size:clamp(24px,3.4vw,34px);font-weight:300;color:#f5f7fa;line-height:1;
  font-variant-numeric:tabular-nums}
.vh-sum-verdi--stor{font-size:clamp(34px,5.4vw,52px);color:#f2c38b}
.vh-sum-verdi--tap{color:#f0a89a}
.vh-sum-navn{font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
  color:#6b7a8f;text-align:center;max-width:16ch}

.vh-sitat{max-width:660px;margin:clamp(28px,4vh,44px) auto 0;padding:24px 28px;border-radius:18px;
  background:rgba(245,247,250,.04);border-left:2px solid #d8a66a;text-align:left}
.vh-sitat-tekst{font-size:clamp(17px,2.4vw,21px);font-weight:300;line-height:1.6;color:#f5f7fa;
  text-wrap:balance}
.vh-sitat-navn{margin-top:12px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;
  color:#6b7a8f}

.vh-tidslinje{max-width:720px;margin:clamp(34px,6vh,60px) auto 0}
.vh-ar{padding:26px 0;border-top:1px solid rgba(216,166,106,.18)}
.vh-ar-hode{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap}
.vh-ar-tall{font-size:clamp(26px,3.6vw,36px);font-weight:300;color:#f2c38b;line-height:1;
  font-variant-numeric:tabular-nums}
.vh-ar-sum{font-size:13px;color:#93a3b8;text-align:right}
.vh-ar-kost{color:#6b7a8f}
.vh-ar-stille{margin-top:14px;font-size:14px;color:#55637a;font-style:italic}

.vh-hendelser{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-direction:column;gap:2px}
.vh-hendelse{display:flex;align-items:baseline;gap:14px;padding:9px 6px;border-radius:8px;
  transition:background .3s}
.vh-hendelse:hover{background:rgba(245,247,250,.03)}
.vh-hendelse-dato{flex:none;width:92px;font-size:12px;color:#55637a}
.vh-hendelse-tekst{flex:1;min-width:0;font-size:15px;color:#f5f7fa}
.vh-hendelse-slag{display:inline-block;margin-right:9px;font-size:10px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;color:#d8a66a}
.vh-hendelse-belop{flex:none;font-size:14px;color:#93a3b8;font-variant-numeric:tabular-nums}

.vh-hist-bunn{max-width:720px;margin:clamp(30px,5vh,50px) auto 0;display:flex;gap:10px;
  justify-content:center;flex-wrap:wrap}
.vh-hist-knapp{font:inherit;font-size:14px;padding:12px 22px;border-radius:999px;cursor:pointer;
  text-decoration:none;background:none;color:#93a3b8;border:1px solid rgba(216,166,106,.2);
  transition:color .4s,border-color .4s,transform .4s}
.vh-hist-knapp:hover{color:#f5f7fa;border-color:rgba(216,166,106,.46)}
.vh-hist-knapp--gull{background:linear-gradient(180deg,#f2c38b,#d8a66a);color:#04111f;font-weight:600;
  border-color:transparent}
.vh-hist-knapp--gull:hover{color:#04111f;transform:translateY(-1px)}

@media print{
  .vh-hist{background:#fff;color:#111;padding:0;min-height:0}
  .vh-hist-lys{display:none}
  .vh-hist-tittel,.vh-sum-verdi,.vh-ar-tall,.vh-hendelse-tekst,.vh-sitat-tekst{color:#111}
  .vh-sum-verdi--stor,.vh-ar-tall,.vh-hendelse-slag{color:#8a6428}
  .vh-hist-under,.vh-sum-navn,.vh-ar-sum,.vh-hendelse-dato,.vh-hendelse-belop,.vh-sitat-navn{color:#444}
  .vh-sitat{background:#f6f6f4;border-left-color:#8a6428}
  .vh-ar{border-top-color:#ddd;break-inside:avoid}
  .vh-akser{display:none}
}
`}</style>
  );
}

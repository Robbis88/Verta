"use client";

import Link from "next/link";
import { useState } from "react";

import type { Elv } from "@/lib/hus";

/**
 * TID — de neste 90 døgnene som en elv, ikke et kalenderrutenett.
 *
 * Oppholdene er sammenhengende bånd. De tomme nettene er hull, og hvert hull
 * er merket med hva det FAKTISK koster deg — regnet av baseprisen og
 * sesongprisene du allerede har satt. Vask ligger langs bredden.
 *
 * Leser bookings, seasonal_rates, properties.base_nightly_rate og
 * cleaning_tasks. Ingen ny tabell, ingen endret prislogikk. Full kalender
 * ligger som før inne på eiendommen.
 */

const DAG = 15; // piksler per døgn

const KILDE: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  verta_direct: "Direkte",
  verta_instagram: "Instagram",
  verta_facebook: "Facebook",
};

function dagIndeks(start: string, iso: string): number {
  const a = new Date(`${start}T00:00:00Z`).getTime();
  const b = new Date(`${iso}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86400000);
}

function kroner(n: number): string {
  return `${new Intl.NumberFormat("nb-NO").format(Math.round(n))} kr`;
}

function kortDato(iso: string): string {
  return new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })
    .replace(".", "");
}

/** Månedsskiller langs elven — gir tiden form uten et rutenett. */
function maneder(start: string, dager: number): { navn: string; x: number }[] {
  const ut: { navn: string; x: number }[] = [];
  const d0 = new Date(`${start}T00:00:00Z`).getTime();
  for (let i = 0; i < dager; i++) {
    const d = new Date(d0 + i * 86400000);
    if (i === 0 || d.getUTCDate() === 1) {
      ut.push({
        navn: d.toLocaleDateString("nb-NO", { month: "long", timeZone: "UTC" }),
        x: i * DAG,
      });
    }
  }
  return ut;
}

export function TidElv({
  boligNavn,
  boligAntall,
  elv,
}: {
  boligNavn: string | null;
  boligAntall: number;
  elv: Elv;
}) {
  const [hvorfor, setHvorfor] = useState(false);
  const bredde = elv.dager * DAG;
  const husnavn =
    boligNavn ?? (boligAntall > 1 ? `${boligAntall} boliger` : "boligen din");

  const verstehull =
    [...elv.hull].sort((a, b) => b.tap - a.tap || b.netter - a.netter)[0] ?? null;
  const belegg = Math.round(elv.belegg * 100);
  const venter = elv.opphold.filter((o) => o.venter).length;

  return (
    <main className="vh-tid">
      <div className="vh-tid-lys" aria-hidden="true" />

      <header className="vh-tid-topp">
        <p className="vh-tid-merke">Tid</p>
        <h1 className="vh-tid-tittel">
          De neste tre månedene for {husnavn.toLowerCase()}.
        </h1>
        <p className="vh-tid-under">
          {elv.opphold.length === 0
            ? "Ingen opphold på vei ennå. Hele elven ligger åpen."
            : `${elv.opphold.length} opphold på vei. ${belegg} % av nettene er booket.` +
              (venter > 0
                ? ` ${venter} venter på svar fra deg.`
                : "")}
        </p>
      </header>

      <section className="vh-tall" aria-label="Nøkkeltall">
        <div className="vh-tall-en">
          <span className="vh-tall-verdi">{belegg} %</span>
          <span className="vh-tall-navn">av nettene er solgt</span>
        </div>
        <div className="vh-tall-strek" aria-hidden="true" />
        <div className="vh-tall-en">
          <span className="vh-tall-verdi vh-tall-verdi--tap">
            {elv.snittNattpris === null ? "—" : kroner(elv.taptTotalt)}
          </span>
          <span className="vh-tall-navn">ligger igjen i de tomme nettene</span>
        </div>
        <button
          type="button"
          className="vh-hvorfor-knapp"
          onClick={() => setHvorfor((v) => !v)}
        >
          {hvorfor ? "Skjul" : "Hvorfor?"}
        </button>
      </section>

      {hvorfor && (
        <p className="vh-hvorfor">
          {elv.snittNattpris === null ? (
            <>
              Du har ikke satt nattpris på boligen ennå, så vi kan ikke regne ut
              hva de tomme nettene er verdt.{" "}
              <Link href="/dashboard/prising">Sett pris per natt →</Link>
            </>
          ) : (
            <>
              Vi teller hver natt de neste {elv.dager} døgnene som ikke har en
              bekreftet booking, og ganger den med prisen du selv har satt —
              sesongprisen hvis den dekker datoen, ellers baseprisen. Snittet
              blir {kroner(elv.snittNattpris)} per natt. Forespørsler som venter
              på svar teller ikke som booket. Ingenting er gjettet; tallene er
              dine egne.
            </>
          )}
        </p>
      )}

      <div className="vh-elv-ramme">
        <div className="vh-elv-rull">
          <div className="vh-elv" style={{ width: bredde }}>
            {maneder(elv.start, elv.dager).map((m) => (
              <span key={m.navn + m.x} className="vh-maned" style={{ left: m.x }}>
                {m.navn}
              </span>
            ))}

            <div className="vh-elv-seng" aria-hidden="true" />

            {elv.hull.map((h) => (
              <div
                key={`h-${h.fra}`}
                className="vh-hull"
                style={{
                  left: dagIndeks(elv.start, h.fra) * DAG,
                  width: h.netter * DAG,
                }}
              >
                {h.netter >= 4 && (
                  <span className="vh-hull-tekst">
                    {h.netter} tomme netter
                    {elv.snittNattpris !== null && h.tap > 0 && (
                      <i className="vh-hull-tap"> · {kroner(h.tap)}</i>
                    )}
                  </span>
                )}
              </div>
            ))}

            {elv.opphold.map((o) => {
              const x = Math.max(0, dagIndeks(elv.start, o.inn)) * DAG;
              const slutt = Math.min(elv.dager, dagIndeks(elv.start, o.ut));
              const w = Math.max(DAG, slutt * DAG - x);
              return (
                <Link
                  key={o.id}
                  href="/dashboard"
                  className={`vh-bat ${o.venter ? "vh-bat--venter" : ""}`}
                  style={{ left: x, width: w }}
                  title={`${o.gjest} · ${kortDato(o.inn)}–${kortDato(o.ut)} · ${
                    KILDE[o.kilde] ?? o.kilde
                  }${o.venter ? " · venter på svar" : ""}${
                    o.bolig ? ` · ${o.bolig}` : ""
                  }`}
                >
                  <span className="vh-bat-navn">{o.gjest}</span>
                  <span className="vh-bat-meta">
                    {o.venter
                      ? "venter på svar"
                      : `${o.netter} netter${o.belop ? ` · ${kroner(o.belop)}` : ""}`}
                  </span>
                </Link>
              );
            })}

            {elv.merker.map((m) => (
              <Link
                key={m.id}
                href={m.href}
                className="vh-merke"
                style={{ left: dagIndeks(elv.start, m.dato) * DAG }}
                title={`${m.tekst} · ${kortDato(m.dato)}`}
              >
                <span className="vh-merke-prikk" />
                <span className="vh-merke-tekst">{m.tekst}</span>
              </Link>
            ))}

            <div className="vh-idag">
              <span className="vh-idag-tekst">i dag</span>
            </div>
          </div>
        </div>
        <p className="vh-elv-hint">Dra sidelengs for å se lenger frem →</p>
      </div>

      {verstehull && verstehull.netter >= 4 && (
        <section className="vh-forslag">
          <p className="vh-forslag-merke">Det største hullet</p>
          <p className="vh-forslag-tekst">
            {verstehull.netter} netter fra {kortDato(verstehull.fra)}
            {elv.snittNattpris !== null && verstehull.tap > 0 && (
              <> — verdt {kroner(verstehull.tap)}</>
            )}
            .
          </p>
          <div className="vh-forslag-knapper">
            <Link href="/dashboard/varsler" className="vh-tid-knapp vh-tid-knapp--gull">
              Lag en kampanje for disse datoene
            </Link>
            <Link href="/dashboard/prising" className="vh-tid-knapp">
              Vurder prisen
            </Link>
          </div>
        </section>
      )}

      {elv.opphold.length === 0 && (
        <section className="vh-forslag">
          <p className="vh-forslag-merke">Tomt fremover</p>
          <p className="vh-forslag-tekst">
            Ingen opphold de neste {elv.dager} døgnene.
          </p>
          <div className="vh-forslag-knapper">
            <Link
              href="/dashboard/properties"
              className="vh-tid-knapp vh-tid-knapp--gull"
            >
              Koble Airbnb-kalenderen
            </Link>
            <Link href="/dashboard/varsler" className="vh-tid-knapp">
              Se hva Verta foreslår
            </Link>
          </div>
        </section>
      )}

      <TidStil />
    </main>
  );
}

function TidStil() {
  return (
    <style>{`
.vh-tid{position:relative;min-height:100dvh;background:#04111f;color:#f5f7fa;overflow-x:hidden;
  font-family:var(--font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif);
  padding:clamp(30px,6vh,64px) 0 132px}
.vh-tid-lys{position:fixed;inset:0;pointer-events:none;background:
  radial-gradient(110% 70% at 22% -10%,rgba(90,150,190,.18),transparent 60%),
  linear-gradient(180deg,#07203a 0%,#04111f 58%)}
.vh-tid>*:not(.vh-tid-lys){position:relative;z-index:1}

.vh-tid-topp{max-width:780px;margin:0 auto;text-align:center;padding:0 clamp(20px,5vw,60px)}
.vh-tid-merke{font-size:11px;font-weight:600;letter-spacing:.34em;text-transform:uppercase;
  color:#d8a66a;padding-left:.34em}
.vh-tid-tittel{margin-top:14px;font-size:clamp(26px,4.4vw,42px);font-weight:300;line-height:1.1;
  color:#f5f7fa;text-wrap:balance}
.vh-tid-under{margin-top:12px;font-size:15px;color:#93a3b8;text-wrap:balance}

.vh-tall{max-width:780px;margin:clamp(26px,4vh,42px) auto 0;padding:0 clamp(20px,5vw,60px);
  display:flex;align-items:center;justify-content:center;gap:clamp(18px,4vw,44px);flex-wrap:wrap}
.vh-tall-en{display:flex;flex-direction:column;align-items:center;gap:5px}
.vh-tall-verdi{font-size:clamp(30px,5vw,44px);font-weight:300;color:#f5f7fa;line-height:1;
  font-variant-numeric:tabular-nums}
.vh-tall-verdi--tap{color:#e9c48d}
.vh-tall-navn{font-size:11px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;
  color:#6b7a8f;text-align:center}
.vh-tall-strek{width:1px;height:44px;background:rgba(216,166,106,.22)}
.vh-hvorfor-knapp{background:none;border:1px solid rgba(216,166,106,.22);border-radius:999px;
  padding:7px 15px;font:inherit;font-size:12px;letter-spacing:.08em;color:#93a3b8;cursor:pointer;
  transition:color .4s,border-color .4s}
.vh-hvorfor-knapp:hover{color:#f5f7fa;border-color:rgba(216,166,106,.5)}
.vh-hvorfor{max-width:640px;margin:18px auto 0;padding:0 clamp(20px,5vw,60px);font-size:14px;
  line-height:1.7;color:#93a3b8;text-align:center;text-wrap:balance}
.vh-hvorfor a{color:#d8a66a;text-decoration:underline}

.vh-elv-ramme{margin-top:clamp(28px,5vh,50px)}
.vh-elv-rull{overflow-x:auto;overflow-y:hidden;padding:0 clamp(20px,5vw,60px) 6px;
  scrollbar-width:thin;scrollbar-color:rgba(216,166,106,.35) transparent}
.vh-elv{position:relative;height:230px}
.vh-elv-seng{position:absolute;left:0;right:0;top:96px;height:44px;border-radius:6px;
  background:linear-gradient(180deg,rgba(120,170,200,.14),rgba(120,170,200,.05));
  border-top:1px solid rgba(150,200,230,.12);border-bottom:1px solid rgba(150,200,230,.12)}

.vh-maned{position:absolute;top:0;font-size:11px;font-weight:500;letter-spacing:.22em;
  text-transform:uppercase;color:#55637a;padding-left:9px;height:82px;
  border-left:1px solid rgba(150,200,230,.16);display:flex;align-items:flex-start;padding-top:2px;
  white-space:nowrap}

.vh-hull{position:absolute;top:96px;height:44px;border-radius:6px;overflow:hidden;
  background:repeating-linear-gradient(115deg,rgba(216,166,106,.10) 0 6px,transparent 6px 13px);
  border:1px dashed rgba(216,166,106,.26);display:flex;align-items:center;justify-content:center}
.vh-hull-tekst{font-size:11px;color:#d8a66a;white-space:nowrap;padding:0 6px}
.vh-hull-tap{font-style:normal;color:#e9c48d}

.vh-bat{position:absolute;top:90px;height:56px;border-radius:9px;padding:9px 12px;overflow:hidden;
  display:flex;flex-direction:column;justify-content:center;gap:2px;text-decoration:none;
  background:linear-gradient(180deg,#f2c38b,#d8a66a);box-shadow:0 10px 26px rgba(0,0,0,.38);
  transition:transform .45s cubic-bezier(.2,.7,.2,1),box-shadow .45s}
.vh-bat:hover{transform:translateY(-3px);box-shadow:0 16px 34px rgba(0,0,0,.48)}
.vh-bat-navn{font-size:13px;font-weight:600;color:#04111f;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.vh-bat-meta{font-size:11px;color:rgba(4,17,31,.72);white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.vh-bat--venter{background:repeating-linear-gradient(135deg,rgba(242,195,139,.5) 0 8px,
  rgba(242,195,139,.28) 8px 16px);border:1px dashed rgba(242,195,139,.9)}
.vh-bat--venter .vh-bat-navn{color:#f5f7fa}
.vh-bat--venter .vh-bat-meta{color:#f2c38b}

.vh-merke{position:absolute;top:154px;display:flex;flex-direction:column;align-items:center;gap:5px;
  text-decoration:none;transform:translateX(-50%);width:80px}
.vh-merke-prikk{width:7px;height:7px;border-radius:50%;background:#7fb79a;flex:none}
.vh-merke-tekst{font-size:10px;color:#6b7a8f;text-align:center;line-height:1.3;max-height:26px;
  overflow:hidden}
.vh-merke:hover .vh-merke-tekst{color:#c3cede}

.vh-idag{position:absolute;top:76px;bottom:56px;left:0;width:1px;
  background:linear-gradient(180deg,rgba(245,247,250,.55),rgba(245,247,250,.05))}
.vh-idag-tekst{position:absolute;top:-18px;left:0;font-size:10px;font-weight:600;letter-spacing:.18em;
  text-transform:uppercase;color:#f5f7fa;white-space:nowrap}

.vh-elv-hint{margin-top:6px;padding:0 clamp(20px,5vw,60px);font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:#42506380;text-align:right}

.vh-forslag{max-width:640px;margin:clamp(24px,4vh,40px) auto 0;padding:24px clamp(20px,4vw,30px);
  border-radius:20px;text-align:center;
  background:linear-gradient(180deg,rgba(8,27,51,.78),rgba(4,17,31,.55));
  border:1px solid rgba(216,166,106,.18);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.vh-forslag-merke{font-size:11px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;
  color:#d8a66a}
.vh-forslag-tekst{margin-top:12px;font-size:clamp(19px,2.8vw,25px);font-weight:400;color:#f5f7fa;
  text-wrap:balance}
.vh-forslag-knapper{margin-top:20px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.vh-tid-knapp{font-size:14px;padding:11px 20px;border-radius:999px;text-decoration:none;color:#93a3b8;
  border:1px solid rgba(216,166,106,.18);transition:color .4s,border-color .4s,transform .4s}
.vh-tid-knapp:hover{color:#f5f7fa;border-color:rgba(216,166,106,.44)}
.vh-tid-knapp--gull{background:linear-gradient(180deg,#f2c38b,#d8a66a);color:#04111f;font-weight:600;
  border-color:transparent}
.vh-tid-knapp--gull:hover{color:#04111f;transform:translateY(-1px)}

@media (prefers-reduced-motion:reduce){
  .vh-bat:hover{transform:none}
}
`}</style>
  );
}

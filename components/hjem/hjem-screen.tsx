"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { HusetNa } from "@/lib/hus";

/**
 * Startskjermen — «ro som standard».
 *
 * Boligen din i stort bilde, én hilsen, og ÉN ting som fortjener deg akkurat
 * nå. Ingen KPI-bokser, ingen grafer, ingen widgets. Trenger ingenting deg,
 * står det bare at alt er i orden — og en tom, rolig skjerm er meningen.
 *
 * Alt annet finnes fortsatt: aksebaren nederst (Rom · Tid · Ord · Alt) fører
 * til hver eneste modul, og det gamle dashbordet ligger urørt på /dashboard.
 */

function hilsen(): string {
  const h = new Date().getHours();
  if (h < 5) return "God natt";
  if (h < 10) return "God morgen";
  if (h < 18) return "God dag";
  return "God kveld";
}

/**
 * Husets lys følger virkeligheten: årstiden og klokkeslettet ditt. Vinternatt
 * er dyp og blå, sommerformiddag er høy og gyllen. Ren presentasjon — men det
 * er dette som gjør at skjermen føles levende og ikke som et bilde.
 */
function lysNa(): string {
  const d = new Date();
  const m = d.getMonth(); // 0-11
  const t = d.getHours();
  const sesong =
    m === 11 || m <= 1
      ? "vinter"
      : m <= 4
        ? "var"
        : m <= 7
          ? "sommer"
          : "host";
  const tid =
    t < 6 ? "natt" : t < 10 ? "morgen" : t < 17 ? "dag" : t < 22 ? "kveld" : "natt";
  return `${sesong}-${tid}`;
}

export function HjemScreen({
  fornavn,
  na,
}: {
  fornavn: string;
  na: HusetNa;
}) {
  const [avduket, setAvduket] = useState(false);
  // Lyset skrives rett på elementet etter montering (ikke via state), så
  // serveren og nettleseren aldri er uenige om hva klokka er.
  const flate = useRef<HTMLElement>(null);
  useEffect(() => {
    flate.current?.setAttribute("data-lys", lysNa());
    const t = setTimeout(() => setAvduket(true), 1300);
    return () => clearTimeout(t);
  }, []);

  const ny = na.boligAntall === 0;
  const ting = na.ting;
  const ro = !ting || ting.tone === "ro";

  const husFrase = na.boligNavn
    ? `${na.boligNavn} har det bra.`
    : na.boligAntall > 1
      ? "Boligene dine har det bra."
      : "Boligen din har det bra.";

  return (
    <main className="vh-hjem" ref={flate}>
      <div className={`vh-slor ${avduket ? "vh-slor--vekk" : ""}`} aria-hidden="true">
        <span className="vh-slor-logo">VERTA</span>
      </div>

      <div
        className="vh-hus"
        style={na.bilde ? { backgroundImage: `url("${na.bilde}")` } : undefined}
        aria-hidden="true"
      />
      {/* Årstidens og døgnets lys, lagt over bildet. */}
      <div className="vh-lys" aria-hidden="true" />
      <div className="vh-slore" aria-hidden="true" />

      <div className="vh-innhold">
        <header className="vh-topp">
          <p className="vh-merke">VERTA</p>
          <h1 className="vh-hilsen">
            {hilsen()}
            {fornavn ? `, ${fornavn}` : ""}.
            <br />
            <span className="vh-hilsen-lys">
              {ny
                ? "La oss komme i gang."
                : ro
                  ? husFrase
                  : na.boligNavn
                    ? `${na.boligNavn} trenger deg litt.`
                    : "Noe trenger deg litt."}
            </span>
          </h1>
        </header>

        <div aria-hidden="true" />

        <footer className="vh-bunn">
          {ny ? (
            <DenEneTingen
              merke="Kom i gang"
              overskrift="Velkommen til Verta."
              under="Legg inn boligen din, så bygger vi hjemmet ditt her."
              tone="ro"
              knappTekst="Legg til bolig"
              knappHref="/dashboard/properties/new"
            />
          ) : ting ? (
            <DenEneTingen
              merke={ting.merke}
              overskrift={ting.overskrift}
              under={ting.under}
              tone={ting.tone}
              knappTekst={ting.knappTekst}
              knappHref={ting.knappHref}
            />
          ) : (
            <div className="vh-rolig">
              <p className="vh-rolig-stor">Alt er i orden.</p>
              <p className="vh-rolig-sub">
                Ingen gjester som venter, ingenting som haster. Boligen hviler.
              </p>
            </div>
          )}

          {!ny && (
            <p className="vh-hvisk">
              <span className="vh-blad">❦</span>
              {na.restAntall > 0
                ? ` Jeg holder øye med ${na.restAntall} ting til. Du får beskjed når de haster.`
                : " Alt annet er i orden. Jeg sier fra hvis noe trenger deg."}
            </p>
          )}
        </footer>
      </div>

      <HjemStil />
    </main>
  );
}

function DenEneTingen({
  merke,
  overskrift,
  under,
  tone,
  knappTekst,
  knappHref,
}: {
  merke: string;
  overskrift: string;
  under: string | null;
  tone: "ro" | "obs" | "kritisk";
  knappTekst: string;
  knappHref: string;
}) {
  return (
    <section className="vh-idag" aria-label="Dagens ene ting">
      <div className="vh-brynn">{merke}</div>
      <p className="vh-overskrift">{overskrift}</p>
      {under && (
        <p className={`vh-under vh-under--${tone}`}>
          {tone === "ro" && <span className="vh-hake">✓</span>}
          {under}
        </p>
      )}
      <div className="vh-knapper">
        <Link href={knappHref} className="vh-knapp vh-knapp--gull">
          {knappTekst}
        </Link>
        <Link href="/hjem/tid" className="vh-knapp vh-knapp--stille">
          Ikke nå
        </Link>
      </div>
    </section>
  );
}

function HjemStil() {
  return (
    <style>{`
.vh-hjem{position:fixed;inset:0;overflow:hidden;background:#04111f;color:#f5f7fa;
  font-family:var(--font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif)}
.vh-hus{position:absolute;inset:0;background-size:cover;background-position:center;
  transform:scale(1.08);animation:vhPust 30s ease-in-out infinite alternate;
  background-color:#04111f;background-image:
    radial-gradient(120% 90% at 70% 8%,rgba(216,166,106,.20),transparent 55%),
    linear-gradient(180deg,#0b2340 0%,#081b33 36%,#051526 72%,#04111f 100%)}
.vh-slore{position:absolute;inset:0;background:linear-gradient(180deg,
  rgba(4,17,31,.42) 0%,rgba(4,17,31,.18) 34%,rgba(4,17,31,.62) 70%,rgba(4,17,31,.96) 100%)}

/* Årstidens og døgnets lys. Legges over bildet, under sløret, og tones rolig
   inn etter montering. Standard = nøytralt, så skjermen aldri blinker. */
.vh-lys{position:absolute;inset:0;opacity:0;transition:opacity 2.2s ease,background 2.2s ease;
  mix-blend-mode:soft-light}
.vh-hjem[data-lys] .vh-lys{opacity:1}

.vh-hjem[data-lys$="-natt"] .vh-lys{background:linear-gradient(180deg,
  rgba(10,30,70,.95),rgba(4,10,26,.98));mix-blend-mode:multiply}
.vh-hjem[data-lys$="-morgen"] .vh-lys{background:radial-gradient(90% 70% at 22% 14%,
  rgba(255,208,170,.85),transparent 62%)}
.vh-hjem[data-lys$="-dag"] .vh-lys{background:radial-gradient(110% 80% at 50% 0%,
  rgba(255,244,222,.7),transparent 66%)}
.vh-hjem[data-lys$="-kveld"] .vh-lys{background:linear-gradient(180deg,
  rgba(255,150,90,.7),rgba(40,30,80,.85))}

.vh-hjem[data-lys^="vinter"] .vh-lys{filter:saturate(.7) brightness(.86)}
.vh-hjem[data-lys^="vinter"]{--vh-aksent:#bcd4ea}
.vh-hjem[data-lys^="sommer"] .vh-lys{filter:saturate(1.18) brightness(1.1)}
.vh-hjem[data-lys^="host"] .vh-lys{filter:sepia(.22) saturate(1.1)}
.vh-hjem[data-lys^="var"] .vh-lys{filter:saturate(1.05) brightness(1.04)}
@keyframes vhPust{from{transform:scale(1.08) translateY(0)}to{transform:scale(1.14) translateY(-1.2%)}}

.vh-innhold{position:relative;z-index:4;height:100%;display:grid;grid-template-rows:auto 1fr auto;
  padding:clamp(28px,5vh,56px) clamp(22px,5vw,60px) clamp(96px,14vh,132px)}
.vh-topp{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
.vh-merke{font-size:13px;font-weight:600;letter-spacing:.42em;color:#d8a66a;padding-left:.42em;
  opacity:0;animation:vhStig 1.2s cubic-bezier(.2,.7,.2,1) 1.4s forwards}
.vh-hilsen{font-size:clamp(30px,5.6vw,58px);font-weight:300;line-height:1.06;letter-spacing:-.01em;
  text-wrap:balance;color:#f5f7fa;opacity:0;animation:vhStig 1.4s cubic-bezier(.2,.7,.2,1) 1.6s forwards}
.vh-hilsen-lys{color:#93a3b8}

.vh-bunn{display:flex;flex-direction:column;align-items:center;gap:20px}
.vh-idag,.vh-rolig{width:min(560px,100%);border-radius:22px;padding:26px 28px;
  background:linear-gradient(180deg,rgba(8,27,51,.80),rgba(4,17,31,.62));
  border:1px solid rgba(216,166,106,.18);
  backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);
  box-shadow:0 24px 60px rgba(0,0,0,.45),inset 0 1px 0 rgba(245,247,250,.06);
  opacity:0;animation:vhStig 1.6s cubic-bezier(.2,.7,.2,1) 1.9s forwards}
.vh-brynn{font-size:11px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:#d8a66a;
  display:flex;align-items:center;gap:10px;margin-bottom:14px}
.vh-brynn::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(216,166,106,.28),transparent)}
.vh-overskrift{font-size:clamp(21px,3.1vw,28px);font-weight:400;line-height:1.24;color:#f5f7fa;
  text-wrap:balance}
.vh-under{margin-top:12px;font-size:15px;display:flex;align-items:center;gap:9px}
.vh-under--ro{color:#93a3b8}
.vh-under--obs{color:#e9c48d}
.vh-under--kritisk{color:#f0a89a}
.vh-hake{color:#7fb79a}
.vh-knapper{margin-top:22px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.vh-knapp{font-size:14px;padding:12px 22px;border-radius:999px;text-decoration:none;
  border:1px solid transparent;display:inline-block;
  transition:transform .4s cubic-bezier(.2,.7,.2,1),color .4s,border-color .4s}
.vh-knapp--gull{background:linear-gradient(180deg,#f2c38b,#d8a66a);color:#04111f;font-weight:600}
.vh-knapp--gull:hover{transform:translateY(-1px)}
.vh-knapp--stille{color:#93a3b8;border-color:rgba(216,166,106,.18)}
.vh-knapp--stille:hover{color:#f5f7fa;border-color:rgba(216,166,106,.4)}

.vh-rolig-stor{font-size:clamp(24px,3.6vw,32px);font-weight:300;color:#f5f7fa}
.vh-rolig-sub{margin-top:10px;font-size:15px;color:#93a3b8}

.vh-hvisk{font-size:13px;letter-spacing:.05em;color:#6b7a8f;display:flex;align-items:center;gap:8px;
  text-align:center;text-wrap:balance;opacity:0;animation:vhTon 1.8s ease 2.5s forwards}
.vh-blad{color:#7fb79a}

.vh-slor{position:fixed;inset:0;z-index:20;background:#04111f;display:grid;place-items:center;
  transition:opacity .8s ease,visibility .8s ease}
.vh-slor--vekk{opacity:0;visibility:hidden}
.vh-slor-logo{font-size:clamp(22px,4vw,34px);font-weight:600;letter-spacing:.5em;color:#d8a66a;
  padding-left:.5em;animation:vhLogoInn 1s ease .1s both}
@keyframes vhLogoInn{from{opacity:0;letter-spacing:.9em}to{opacity:1;letter-spacing:.5em}}
@keyframes vhStig{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes vhTon{from{opacity:0}to{opacity:1}}

@media (prefers-reduced-motion:reduce){
  .vh-hus{animation:none!important}
  .vh-merke,.vh-hilsen,.vh-idag,.vh-rolig,.vh-hvisk{opacity:1!important;animation:none!important}
  .vh-slor{display:none}
}
`}</style>
  );
}

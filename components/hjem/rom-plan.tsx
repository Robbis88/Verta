"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Husplan, Sone, SoneId } from "@/lib/hus";

/**
 * ROM — boligen innvendig, som en plantegning i stedet for en meny.
 *
 * Hvert felt er en ekte sone. Trykk på et rom og du får alt som hører til DER:
 * utstyret med alder og garanti, tilkomsten, lageret, historikken, folkene
 * dine. Data leses fra house_equipment, properties.access_info, smart_locks,
 * supplies, property_events, property_contacts og incident_claims — ingenting
 * er endret, bare festet til stedet det hører hjemme.
 */

const I_PLANEN: SoneId[] = [
  "soverom",
  "bad",
  "kjokken",
  "stue",
  "ute",
  "teknikk",
  "adgang",
  "lager",
];
const I_SKUFFEN: SoneId[] = ["historikk", "folk", "skader"];

export function RomPlan({
  boligNavn,
  boligAntall,
  plan,
}: {
  boligNavn: string | null;
  boligAntall: number;
  plan: Husplan;
}) {
  const [apen, setApen] = useState<SoneId | null>(null);
  const sone = apen ? (plan.soner.find((s) => s.id === apen) ?? null) : null;

  const varslerTotalt = plan.soner.reduce((n, s) => n + s.varsler, 0);
  const husnavn =
    boligNavn ?? (boligAntall > 1 ? `${boligAntall} boliger` : "Boligen din");

  return (
    <main className="vh-rom">
      <div className="vh-rom-lys" aria-hidden="true" />

      <header className="vh-rom-topp">
        <p className="vh-rom-merke">Rom</p>
        <h1 className="vh-rom-tittel">{husnavn}, innvendig.</h1>
        <p className="vh-rom-under">
          {boligAntall === 0
            ? "Du har ingen bolig ennå — legg den inn, så tegner huset seg selv her."
            : varslerTotalt === 0
              ? "Ingenting i huset roper på deg. Trykk på et rom for å se hva som står der."
              : `${varslerTotalt} ting lyser. Trykk på rommet for å se hva det er.`}
        </p>
      </header>

      {boligAntall === 0 ? (
        <div className="vh-rom-tom">
          <Link href="/dashboard/properties/new" className="vh-rom-knapp">
            Legg til bolig
          </Link>
        </div>
      ) : (
        <>
          <div className="vh-plan" role="group" aria-label="Plantegning">
            {I_PLANEN.map((id) => {
              const s = plan.soner.find((x) => x.id === id);
              if (!s) return null;
              const hint =
                id === "soverom" && plan.soverom
                  ? `${plan.soverom} soverom`
                  : id === "bad" && plan.bad
                    ? `${plan.bad} bad`
                    : null;
              return (
                <Rommet
                  key={id}
                  sone={s}
                  hint={hint}
                  onClick={() => setApen(id)}
                />
              );
            })}
          </div>

          <div className="vh-skuffer">
            {I_SKUFFEN.map((id) => {
              const s = plan.soner.find((x) => x.id === id);
              if (!s) return null;
              return (
                <button
                  key={id}
                  type="button"
                  className="vh-skuff"
                  onClick={() => setApen(id)}
                >
                  <span className="vh-skuff-navn">{s.navn}</span>
                  <span className="vh-skuff-tall">
                    {s.ting.length === 0 ? "tom" : s.ting.length}
                    {s.varsler > 0 && <i className="vh-prikk" aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>

          {plan.saker.length > 0 && (
            <section className="vh-saker" aria-label="Åpne saker">
              <p className="vh-saker-tittel">
                Huset har {plan.saker.length}{" "}
                {plan.saker.length === 1 ? "åpen sak" : "åpne saker"}
              </p>
              <div className="vh-saker-rad">
                {plan.saker.map((s) => (
                  <Link
                    key={s.id}
                    href="/dashboard/vedlikehold"
                    className={`vh-sak vh-sak--${s.prioritet}`}
                  >
                    {s.tittel}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {sone && <SoneArk sone={sone} onLukk={() => setApen(null)} />}

      <RomStil />
    </main>
  );
}

function Rommet({
  sone,
  hint,
  onClick,
}: {
  sone: Sone;
  hint: string | null;
  onClick: () => void;
}) {
  const glod = Math.min(sone.varsler, 4) / 4;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`vh-celle vh-celle--${sone.id} ${sone.varsler > 0 ? "vh-celle--lyser" : ""}`}
      style={{ ["--glod" as string]: glod }}
      aria-label={`${sone.navn} — ${sone.ting.length} ting${
        sone.varsler > 0 ? `, ${sone.varsler} krever noe` : ""
      }`}
    >
      <span className="vh-celle-navn">{sone.navn}</span>
      <span className="vh-celle-meta">
        {hint ??
          (sone.ting.length === 0
            ? "ingenting her ennå"
            : `${sone.ting.length} ting`)}
      </span>
      {sone.varsler > 0 && (
        <span className="vh-celle-varsel">{sone.varsler}</span>
      )}
    </button>
  );
}

function SoneArk({ sone, onLukk }: { sone: Sone; onLukk: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onLukk();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onLukk]);

  return (
    <div className="vh-ark-bak" onClick={onLukk} role="presentation">
      <aside
        className="vh-ark"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={sone.navn}
      >
        <header className="vh-ark-topp">
          <div>
            <h2 className="vh-ark-tittel">{sone.navn}</h2>
            <p className="vh-ark-hva">{sone.hva}</p>
          </div>
          <button
            type="button"
            onClick={onLukk}
            className="vh-ark-lukk"
            aria-label="Lukk"
          >
            ✕
          </button>
        </header>

        {sone.id === "historikk" && (
          <Link href="/hjem/historie" className="vh-ark-utvei">
            <span className="vh-ark-utvei-tittel">Les hele historien →</span>
            <span className="vh-ark-utvei-hva">
              Alt huset har vært gjennom, år for år — klar til å skrives ut og gis
              til en kjøper.
            </span>
          </Link>
        )}

        {sone.ting.length === 0 ? (
          <div className="vh-ark-tom">
            <p className="vh-ark-tom-stor">Ingenting er registrert her ennå.</p>
            <p className="vh-ark-tom-sub">
              Legger du det inn, husker huset det for deg — og du ser det her
              hver gang.
            </p>
            <Link href={sone.href} className="vh-rom-knapp">
              Legg inn nå
            </Link>
          </div>
        ) : (
          <>
            <ul className="vh-ting">
              {sone.ting.map((t) => (
                <li
                  key={t.id}
                  className={`vh-ting-rad ${t.varsel ? "vh-ting-rad--varsel" : ""}`}
                >
                  <Link href={t.href} className="vh-ting-lenke">
                    <span className="vh-ting-navn">{t.navn}</span>
                    {t.detalj && (
                      <span className="vh-ting-detalj">{t.detalj}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={sone.href} className="vh-rom-knapp">
              Åpne og endre →
            </Link>
          </>
        )}
      </aside>
    </div>
  );
}

function RomStil() {
  return (
    <style>{`
.vh-rom{position:relative;min-height:100dvh;background:#04111f;color:#f5f7fa;overflow-x:hidden;
  font-family:var(--font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif);
  padding:clamp(30px,6vh,64px) clamp(20px,5vw,60px) 132px}
.vh-rom-lys{position:fixed;inset:0;pointer-events:none;background:
  radial-gradient(120% 80% at 50% -10%,rgba(216,166,106,.16),transparent 60%),
  linear-gradient(180deg,#0a2038 0%,#04111f 58%)}
.vh-rom>*:not(.vh-rom-lys){position:relative;z-index:1}

.vh-rom-topp{max-width:760px;margin:0 auto;text-align:center}
.vh-rom-merke{font-size:11px;font-weight:600;letter-spacing:.34em;text-transform:uppercase;
  color:#d8a66a;padding-left:.34em}
.vh-rom-tittel{margin-top:14px;font-size:clamp(28px,5vw,46px);font-weight:300;line-height:1.08;
  color:#f5f7fa;text-wrap:balance}
.vh-rom-under{margin-top:12px;font-size:15px;color:#93a3b8;text-wrap:balance}
.vh-rom-tom{margin-top:48px;text-align:center}

.vh-plan{max-width:880px;margin:clamp(28px,5vh,52px) auto 0;display:grid;gap:10px;
  grid-template-columns:repeat(4,1fr);
  grid-template-areas:
    "soverom soverom bad     teknikk"
    "stue    stue    kjokken kjokken"
    "ute     ute     adgang  lager"}
.vh-celle--soverom{grid-area:soverom}
.vh-celle--bad{grid-area:bad}
.vh-celle--teknikk{grid-area:teknikk}
.vh-celle--stue{grid-area:stue}
.vh-celle--kjokken{grid-area:kjokken}
.vh-celle--ute{grid-area:ute}
.vh-celle--adgang{grid-area:adgang}
.vh-celle--lager{grid-area:lager}

.vh-celle{position:relative;display:flex;flex-direction:column;align-items:flex-start;
  justify-content:flex-end;gap:4px;min-height:clamp(96px,15vh,142px);padding:18px;border-radius:16px;
  text-align:left;cursor:pointer;color:inherit;font:inherit;
  background:linear-gradient(180deg,rgba(245,247,250,.055),rgba(245,247,250,.022));
  border:1px solid rgba(216,166,106,.16);
  transition:transform .5s cubic-bezier(.2,.7,.2,1),border-color .5s,background .5s}
.vh-celle:hover{transform:translateY(-3px);border-color:rgba(216,166,106,.44);
  background:linear-gradient(180deg,rgba(245,247,250,.09),rgba(245,247,250,.03))}
.vh-celle:focus-visible{outline:1px solid #d8a66a;outline-offset:3px}
.vh-celle--lyser{background:
  radial-gradient(90% 70% at 50% 120%,rgba(216,166,106,calc(.12 + var(--glod,0)*.22)),transparent 70%),
  linear-gradient(180deg,rgba(245,247,250,.055),rgba(245,247,250,.022));
  border-color:rgba(216,166,106,calc(.26 + var(--glod,0)*.32))}
.vh-celle-navn{font-size:clamp(17px,2.2vw,21px);font-weight:400;color:#f5f7fa}
.vh-celle-meta{font-size:12px;letter-spacing:.03em;color:#6b7a8f}
.vh-celle-varsel{position:absolute;top:14px;right:14px;min-width:22px;height:22px;padding:0 6px;
  display:grid;place-items:center;border-radius:999px;font-size:11px;font-weight:600;
  background:#d8a66a;color:#04111f}

.vh-skuffer{max-width:880px;margin:10px auto 0;display:grid;gap:10px;grid-template-columns:repeat(3,1fr)}
.vh-skuff{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px 18px;
  border-radius:14px;cursor:pointer;color:inherit;font:inherit;text-align:left;
  background:rgba(245,247,250,.035);border:1px solid rgba(216,166,106,.13);
  transition:border-color .5s,background .5s}
.vh-skuff:hover{border-color:rgba(216,166,106,.38);background:rgba(245,247,250,.065)}
.vh-skuff:focus-visible{outline:1px solid #d8a66a;outline-offset:3px}
.vh-skuff-navn{font-size:16px;color:#f5f7fa}
.vh-skuff-tall{display:flex;align-items:center;gap:7px;font-size:13px;color:#6b7a8f}
.vh-prikk{width:6px;height:6px;border-radius:50%;background:#d8a66a;display:inline-block}

.vh-saker{max-width:880px;margin:26px auto 0}
.vh-saker-tittel{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
  color:#93a3b8;text-align:center}
.vh-saker-rad{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.vh-sak{font-size:13px;padding:8px 15px;border-radius:999px;text-decoration:none;color:#c3cede;
  background:rgba(245,247,250,.04);border:1px solid rgba(216,166,106,.16);
  transition:border-color .4s,color .4s}
.vh-sak:hover{color:#f5f7fa;border-color:rgba(216,166,106,.4)}
.vh-sak--urgent{color:#f0a89a;border-color:rgba(220,120,100,.4)}
.vh-sak--high{color:#e9c48d}

.vh-ark-bak{position:fixed;inset:0;z-index:40;background:rgba(2,9,17,.66);
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;justify-content:flex-end;
  animation:vhArkBak .35s ease}
@keyframes vhArkBak{from{opacity:0}to{opacity:1}}
.vh-ark{width:min(470px,100%);height:100%;overflow-y:auto;
  padding:clamp(24px,4vh,40px) clamp(20px,3vw,34px) 40px;
  background:linear-gradient(180deg,#0a2038,#04111f);
  border-left:1px solid rgba(216,166,106,.22);box-shadow:-30px 0 80px rgba(0,0,0,.55);
  animation:vhArkInn .5s cubic-bezier(.2,.7,.2,1)}
@keyframes vhArkInn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
.vh-ark-topp{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
  padding-bottom:20px;border-bottom:1px solid rgba(216,166,106,.16)}
.vh-ark-tittel{font-size:26px;font-weight:400;color:#f5f7fa}
.vh-ark-hva{margin-top:6px;font-size:14px;color:#93a3b8;max-width:34ch}
.vh-ark-lukk{width:34px;height:34px;flex:none;border-radius:50%;cursor:pointer;font-size:14px;
  background:rgba(245,247,250,.05);border:1px solid rgba(216,166,106,.18);color:#93a3b8;
  transition:color .4s,border-color .4s}
.vh-ark-lukk:hover{color:#f5f7fa;border-color:rgba(216,166,106,.44)}

.vh-ark-utvei{display:block;margin-top:20px;padding:16px 18px;border-radius:14px;text-decoration:none;
  background:linear-gradient(180deg,rgba(216,166,106,.14),rgba(216,166,106,.06));
  border:1px solid rgba(216,166,106,.3);transition:border-color .4s,transform .4s}
.vh-ark-utvei:hover{border-color:rgba(216,166,106,.6);transform:translateY(-2px)}
.vh-ark-utvei-tittel{display:block;font-size:15px;font-weight:600;color:#f2c38b}
.vh-ark-utvei-hva{display:block;margin-top:5px;font-size:13px;line-height:1.5;color:#93a3b8}

.vh-ting{list-style:none;margin:8px 0 0;padding:0}
.vh-ting-rad{border-bottom:1px solid rgba(245,247,250,.06)}
.vh-ting-lenke{display:flex;flex-direction:column;gap:3px;padding:15px 4px;text-decoration:none;
  transition:padding-left .4s}
.vh-ting-lenke:hover{padding-left:8px}
.vh-ting-navn{font-size:15px;color:#f5f7fa}
.vh-ting-detalj{font-size:13px;color:#6b7a8f}
.vh-ting-rad--varsel .vh-ting-navn{color:#f2c38b}
.vh-ting-rad--varsel .vh-ting-detalj{color:#d8a66a}

.vh-ark-tom{padding:46px 0;text-align:center}
.vh-ark-tom-stor{font-size:20px;font-weight:400;color:#f5f7fa}
.vh-ark-tom-sub{margin-top:10px;font-size:14px;color:#93a3b8;text-wrap:balance}
.vh-rom-knapp{display:inline-block;margin-top:26px;padding:12px 24px;border-radius:999px;
  background:linear-gradient(180deg,#f2c38b,#d8a66a);color:#04111f;font-size:14px;font-weight:600;
  text-decoration:none;transition:transform .4s cubic-bezier(.2,.7,.2,1)}
.vh-rom-knapp:hover{transform:translateY(-1px)}

@media (max-width:680px){
  .vh-plan{grid-template-columns:repeat(2,1fr);
    grid-template-areas:
      "soverom bad"
      "stue    kjokken"
      "ute     teknikk"
      "adgang  lager"}
  .vh-skuffer{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){
  .vh-ark,.vh-ark-bak{animation:none}
  .vh-celle:hover{transform:none}
}
`}</style>
  );
}

"use client";

import Link from "next/link";

import { assignTask } from "@/app/dashboard/rengjoring/actions";
import type { Besetning, Person } from "@/lib/hus";

/**
 * BESETNINGEN — menneskene som passer huset, som ansikter i stedet for rader.
 *
 * Vaskere, håndverkere, faste kontakter og co-hosts samlet ett sted, med hva de
 * har på seg nå og ett trykk for å nå dem. Under står arbeidet som ennå ikke
 * har fått noen — og der tildeler du ved å trykke på et ansikt.
 *
 * Bevisst TRYKK og ikke dra-og-slipp: det virker på telefon, det virker med
 * tastatur, og det virker for en som ikke er vant til å dra ting på en skjerm.
 * Tildelingen går gjennom den eksisterende assignTask-handlingen.
 */

function initialer(navn: string): string {
  const deler = navn.trim().split(/\s+/).filter(Boolean);
  if (deler.length === 0) return "?";
  if (deler.length === 1) return deler[0].slice(0, 2).toUpperCase();
  return (deler[0][0] + deler[deler.length - 1][0]).toUpperCase();
}

function dato(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function FolkRom({ besetning }: { besetning: Besetning }) {
  const { folk, ledig, vaskere } = besetning;

  return (
    <main className="vh-folk">
      <div className="vh-folk-lys" aria-hidden="true" />

      <header className="vh-folk-topp">
        <p className="vh-folk-merke">Besetningen</p>
        <h1 className="vh-folk-tittel">
          {folk.length === 0
            ? "Ingen passer huset ennå."
            : folk.length === 1
              ? "Én person passer huset."
              : `${folk.length} personer passer huset.`}
        </h1>
        <p className="vh-folk-under">
          {ledig.length === 0
            ? "Alt arbeid har fått noen. Ingenting ligger og venter."
            : `${ledig.length} ${ledig.length === 1 ? "oppgave venter" : "oppgaver venter"} på noen.`}
        </p>
      </header>

      {ledig.length > 0 && (
        <section className="vh-venter" aria-label="Venter på noen">
          <h2 className="vh-bolk-h">Venter på noen</h2>
          <ul className="vh-venter-liste">
            {ledig.map((l) => (
              <li key={`${l.slag}-${l.id}`} className="vh-venter-rad">
                <div className="vh-venter-hva">
                  <span className="vh-venter-tittel">{l.tittel}</span>
                  <span className="vh-venter-meta">
                    {[l.nar ? dato(l.nar) : null, l.bolig]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>

                {l.slag === "vask" && vaskere.length > 0 ? (
                  <div className="vh-velg">
                    <span className="vh-velg-tekst">Sett på:</span>
                    {vaskere.map((v) => (
                      <form key={v.id} action={assignTask}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="cleaner_id" value={v.id} />
                        <input type="hidden" name="next" value="/hjem/folk" />
                        <button
                          type="submit"
                          className="vh-ansikt vh-ansikt--knapp"
                          title={`Sett ${v.navn} på denne`}
                          aria-label={`Sett ${v.navn} på denne oppgaven`}
                        >
                          {initialer(v.navn)}
                        </button>
                      </form>
                    ))}
                  </div>
                ) : l.slag === "vask" ? (
                  <Link href="/dashboard/rengjoring" className="vh-folk-ut">
                    Legg til en vasker →
                  </Link>
                ) : (
                  <Link href="/dashboard/vedlikehold" className="vh-folk-ut">
                    Tildel →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {folk.length > 0 ? (
        <section className="vh-mannskap" aria-label="Folkene">
          <h2 className="vh-bolk-h">Folkene</h2>
          <ul className="vh-folk-liste">
            {folk.map((p) => (
              <PersonKort key={`${p.slag}-${p.id}`} p={p} />
            ))}
          </ul>
        </section>
      ) : (
        <div className="vh-folk-tom">
          <p>
            Ingen vaskere, håndverkere eller faste kontakter er lagt inn ennå.
          </p>
          <div className="vh-folk-knapper">
            <Link href="/dashboard/rengjoring" className="vh-folk-knapp vh-folk-knapp--gull">
              Legg til en vasker
            </Link>
            <Link href="/dashboard/vedlikehold" className="vh-folk-knapp">
              Legg til en håndverker
            </Link>
          </div>
        </div>
      )}

      <FolkStil />
    </main>
  );
}

function PersonKort({ p }: { p: Person }) {
  const wa = p.telefon ? p.telefon.replace(/[^\d]/g, "").replace(/^00/, "") : "";

  return (
    <li className={`vh-person vh-person--${p.slag}`}>
      <span className="vh-ansikt" aria-hidden="true">
        {initialer(p.navn)}
      </span>

      <div className="vh-person-midt">
        <p className="vh-person-navn">
          {p.navn}
          <span className="vh-person-rolle"> · {p.rolle}</span>
        </p>
        <p className="vh-person-status">
          {p.venter
            ? "har ikke takket ja ennå"
            : p.oppgaver > 0
              ? `${p.oppgaver} ${p.oppgaver === 1 ? "oppgave" : "oppgaver"} nå`
              : "ingenting på seg nå"}
        </p>
      </div>

      <div className="vh-person-hoyre">
        {p.telefon && (
          <a href={`tel:${p.telefon}`} className="vh-tag">
            Ring
          </a>
        )}
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="vh-tag"
          >
            WhatsApp
          </a>
        )}
        {p.epost && (
          <a href={`mailto:${p.epost}`} className="vh-tag">
            E-post
          </a>
        )}
        {p.portal && (
          <Link href={p.portal} className="vh-tag vh-tag--portal">
            Portalen
          </Link>
        )}
      </div>
    </li>
  );
}

function FolkStil() {
  return (
    <style>{`
.vh-folk{position:relative;min-height:100dvh;background:#04111f;color:#f5f7fa;overflow-x:hidden;
  font-family:var(--font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif);
  padding:clamp(30px,6vh,64px) clamp(20px,5vw,60px) 132px}
.vh-folk-lys{position:fixed;inset:0;pointer-events:none;background:
  radial-gradient(110% 70% at 50% -10%,rgba(216,166,106,.13),transparent 60%),
  linear-gradient(180deg,#0a2038 0%,#04111f 58%)}
.vh-folk>*:not(.vh-folk-lys){position:relative;z-index:1}

.vh-folk-topp{max-width:720px;margin:0 auto;text-align:center}
.vh-folk-merke{font-size:11px;font-weight:600;letter-spacing:.34em;text-transform:uppercase;
  color:#d8a66a;padding-left:.34em}
.vh-folk-tittel{margin-top:14px;font-size:clamp(27px,4.6vw,44px);font-weight:300;line-height:1.1;
  color:#f5f7fa;text-wrap:balance}
.vh-folk-under{margin-top:12px;font-size:15px;color:#93a3b8;text-wrap:balance}

.vh-bolk-h{font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;
  color:#d8a66a;padding-bottom:12px;border-bottom:1px solid rgba(216,166,106,.2)}

.vh-venter{max-width:720px;margin:clamp(30px,5vh,50px) auto 0}
.vh-venter-liste{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
.vh-venter-rad{display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:14px 16px;border-radius:14px;flex-wrap:wrap;
  background:radial-gradient(120% 100% at 0% 50%,rgba(216,166,106,.12),transparent 70%),
  rgba(245,247,250,.035);border:1px solid rgba(216,166,106,.22)}
.vh-venter-hva{display:flex;flex-direction:column;gap:3px;min-width:0}
.vh-venter-tittel{font-size:15px;color:#f5f7fa}
.vh-venter-meta{font-size:12px;color:#6b7a8f}
.vh-velg{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.vh-velg-tekst{font-size:12px;color:#93a3b8;margin-right:2px}

.vh-ansikt{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;
  font-size:14px;font-weight:600;letter-spacing:.02em;color:#04111f;
  background:linear-gradient(180deg,#f2c38b,#d8a66a);border:none}
.vh-ansikt--knapp{cursor:pointer;transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s}
.vh-ansikt--knapp:hover{transform:scale(1.12);box-shadow:0 8px 20px rgba(216,166,106,.35)}
.vh-ansikt--knapp:focus-visible{outline:2px solid #f2c38b;outline-offset:3px}

.vh-mannskap{max-width:720px;margin:clamp(30px,5vh,50px) auto 0}
.vh-folk-liste{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:2px}
.vh-person{display:flex;align-items:center;gap:14px;padding:14px 6px;flex-wrap:wrap;
  border-bottom:1px solid rgba(245,247,250,.055)}
.vh-person--kontakt .vh-ansikt{background:linear-gradient(180deg,#9fb4cc,#6f89a8);color:#04111f}
.vh-person--cohost .vh-ansikt{background:linear-gradient(180deg,#a9c9b6,#7fb79a);color:#04111f}
.vh-person-midt{flex:1;min-width:140px}
.vh-person-navn{font-size:16px;color:#f5f7fa}
.vh-person-rolle{color:#6b7a8f;font-size:14px}
.vh-person-status{margin-top:2px;font-size:13px;color:#93a3b8}
.vh-person-hoyre{display:flex;gap:7px;flex-wrap:wrap}
.vh-tag{font-size:12px;padding:7px 13px;border-radius:999px;text-decoration:none;color:#93a3b8;
  border:1px solid rgba(216,166,106,.2);transition:color .4s,border-color .4s}
.vh-tag:hover{color:#f5f7fa;border-color:rgba(216,166,106,.48)}
.vh-tag--portal{color:#f2c38b;border-color:rgba(216,166,106,.35)}

.vh-folk-ut{font-size:13px;color:#93a3b8;text-decoration:none;transition:color .4s}
.vh-folk-ut:hover{color:#d8a66a}

.vh-folk-tom{max-width:560px;margin:60px auto 0;text-align:center;font-size:16px;color:#93a3b8;
  line-height:1.7}
.vh-folk-knapper{margin-top:22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.vh-folk-knapp{font-size:14px;padding:12px 22px;border-radius:999px;text-decoration:none;
  color:#93a3b8;border:1px solid rgba(216,166,106,.2);
  transition:color .4s,border-color .4s,transform .4s}
.vh-folk-knapp:hover{color:#f5f7fa;border-color:rgba(216,166,106,.46)}
.vh-folk-knapp--gull{background:linear-gradient(180deg,#f2c38b,#d8a66a);color:#04111f;font-weight:600;
  border-color:transparent}
.vh-folk-knapp--gull:hover{color:#04111f;transform:translateY(-1px)}

@media (prefers-reduced-motion:reduce){
  .vh-ansikt--knapp:hover{transform:none}
}
`}</style>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

import { markGuestLinkSent } from "@/app/dashboard/alert-actions";
import type { OppholdDetalj } from "@/lib/hus";

/**
 * ETT OPPHOLD — hele gjestens historie som én tråd.
 *
 * Alt om én gjest lå fra før spredt over seks sider: bookingen på eiendommen,
 * meldingene i Meldinger, gjestesiden bak et token, vasken i Rengjøring,
 * skadekravet for seg, betalingen i Økonomi. Her er det samlet i den
 * rekkefølgen det faktisk skjer — før, under, etter.
 *
 * Kun lesing, med ett unntak: «Bekreft sendt» kaller den eksisterende
 * markGuestLinkSent-handlingen (nå med `next`, så du blir stående her).
 */

const KILDE: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  verta_direct: "Direkte",
  verta_instagram: "Instagram",
  verta_facebook: "Facebook",
};

const KANAL: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "E-post",
  other: "Annet",
};

function kroner(n: number): string {
  return `${new Intl.NumberFormat("nb-NO").format(Math.round(n))} kr`;
}

function dato(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function tidspunkt(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Én setning som sier hvor i oppholdet vi er. */
function fasetekst(o: OppholdDetalj): string {
  switch (o.fase) {
    case "avlyst":
      return "Dette oppholdet ble avlyst.";
    case "venter":
      return "Venter på svar fra deg.";
    case "her":
      return `${o.gjest.split(" ")[0]} er her nå.`;
    case "ferdig":
      return "Oppholdet er over.";
    default:
      return o.dagerTil === 0
        ? "Kommer i dag."
        : o.dagerTil === 1
          ? "Kommer i morgen."
          : `Kommer om ${o.dagerTil} dager.`;
  }
}

export function OppholdRom({
  opphold: o,
  siteUrl,
}: {
  opphold: OppholdDetalj;
  siteUrl: string;
}) {
  const gjestelenke = o.gjestToken ? `${siteUrl}/gjest/${o.gjestToken}` : null;

  return (
    <main className="vh-opp">
      <div className="vh-opp-lys" aria-hidden="true" />

      <header className="vh-opp-topp">
        <Link href="/hjem/tid" className="vh-opp-tilbake">
          ← Tilbake til elven
        </Link>
        <p className={`vh-opp-fase vh-opp-fase--${o.fase}`}>{fasetekst(o)}</p>
        <h1 className="vh-opp-navn">{o.gjest}</h1>
        <p className="vh-opp-under">
          {o.netter} {o.netter === 1 ? "natt" : "netter"} · {dato(o.inn)} –{" "}
          {dato(o.ut)} · {o.boligNavn}
          {o.antallGjester ? ` · ${o.antallGjester} gjester` : ""} ·{" "}
          {KILDE[o.kilde] ?? o.kilde}
        </p>
      </header>

      {o.beskjed && (
        <blockquote className="vh-opp-beskjed">
          <p>«{o.beskjed}»</p>
          <footer>{o.gjest} skrev dette da de spurte</footer>
        </blockquote>
      )}

      <div className="vh-opp-tråd">
        {/* FØR */}
        <Bolk tittel="Før ankomst">
          <Rad
            navn="Slik kommer de inn"
            verdi={o.adgangskode ? `Kode ${o.adgangskode}` : "Ingen kode laget"}
            varsel={!o.adgangskode}
          />
          {gjestelenke ? (
            <div className="vh-lenke-blokk">
              <Rad
                navn="Gjestesiden"
                verdi={
                  o.lenkeSendt
                    ? `Sendt${o.lenkeSendtNar ? ` ${tidspunkt(o.lenkeSendtNar)}` : ""}`
                    : "Ikke sendt ennå"
                }
                varsel={!o.lenkeSendt}
              />
              <GjestelenkeKnapp
                bookingId={o.id}
                gjest={o.gjest}
                lenke={gjestelenke}
                sendt={o.lenkeSendt}
              />
            </div>
          ) : (
            <Rad navn="Gjestesiden" verdi="Ingen lenke laget" varsel />
          )}
          {o.epost && <Rad navn="E-post" verdi={o.epost} />}
          {o.telefon && <Rad navn="Telefon" verdi={o.telefon} />}
        </Bolk>

        {/* PENGENE */}
        <Bolk tittel="Pengene">
          <Rad
            navn="Total"
            verdi={o.total != null ? kroner(o.total) : "ikke satt"}
            varsel={o.total == null}
          />
          {o.tjenestegebyr != null && o.tjenestegebyr > 0 && (
            <Rad navn="Tjenestegebyr" verdi={kroner(o.tjenestegebyr)} />
          )}
          {o.depositum != null && o.depositum > 0 && (
            <Rad navn="Depositum" verdi={kroner(o.depositum)} />
          )}
          {o.restbelop != null && o.restbelop > 0 && (
            <Rad
              navn="Restbeløp"
              verdi={`${kroner(o.restbelop)} · ${o.restBetalt ? "betalt" : "ikke betalt"}`}
              varsel={!o.restBetalt}
            />
          )}
          {o.betalingsstatus && (
            <Rad navn="Betalingsstatus" verdi={o.betalingsstatus} />
          )}
          {o.tidligInnsjekkBetalt && <Rad navn="Tidlig innsjekk" verdi="kjøpt" />}
          {o.senUtsjekkBetalt && <Rad navn="Sen utsjekk" verdi="kjøpt" />}
        </Bolk>

        {/* SAMTALEN */}
        <Bolk tittel="Samtalen">
          {o.meldinger.length === 0 ? (
            <p className="vh-opp-stille">
              Ingen meldinger er logget på dette oppholdet.
            </p>
          ) : (
            <ul className="vh-meldinger">
              {o.meldinger.map((m) => (
                <li key={m.id} className={`vh-melding vh-melding--${m.retning}`}>
                  <p className="vh-melding-tekst">{m.tekst}</p>
                  <p className="vh-melding-meta">
                    {m.retning === "inn" ? "Fra gjesten" : "Fra deg"} ·{" "}
                    {KANAL[m.kanal] ?? m.kanal} · {tidspunkt(m.nar)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/meldinger" className="vh-opp-ut">
            Åpne Meldinger →
          </Link>
        </Bolk>

        {/* ETTER */}
        <Bolk tittel="Etterpå">
          <Rad
            navn="Vask"
            verdi={
              o.vask
                ? `${dato(o.vask.dato)} · ${o.vask.status === "completed" ? "utført" : o.vask.status === "pending" ? "ingen vasker satt" : o.vask.status}`
                : "ingen vask planlagt"
            }
            varsel={!o.vask || o.vask.status === "pending"}
          />
          {o.anmeldelse ? (
            <div className="vh-anm">
              <p className="vh-anm-stjerner">
                {"★".repeat(o.anmeldelse.rating)}
                <span className="vh-anm-tom">
                  {"★".repeat(5 - o.anmeldelse.rating)}
                </span>
              </p>
              {o.anmeldelse.kommentar && (
                <p className="vh-anm-tekst">«{o.anmeldelse.kommentar}»</p>
              )}
            </div>
          ) : (
            <Rad navn="Anmeldelse" verdi="ingen ennå" />
          )}
          {o.skader.length > 0 && (
            <ul className="vh-skader">
              {o.skader.map((s) => (
                <li key={s.id}>
                  <Link href={`/dashboard/skade/${o.id}`} className="vh-skade">
                    <span>{s.beskrivelse || "Skadekrav"}</span>
                    <span className="vh-skade-belop">
                      {kroner(s.belop)} ·{" "}
                      {s.status === "paid" ? "betalt" : s.status === "cancelled" ? "avlyst" : "venter"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/dashboard/skade/${o.id}`} className="vh-opp-ut">
            {o.skader.length > 0 ? "Se skadekrav →" : "Meld en skade →"}
          </Link>
        </Bolk>
      </div>

      <div className="vh-opp-bunn">
        <Link
          href={`/dashboard/properties/${o.boligId}`}
          className="vh-opp-knapp vh-opp-knapp--gull"
        >
          Åpne boligen
        </Link>
        <Link href="/hjem/tid" className="vh-opp-knapp">
          Se alle opphold
        </Link>
      </div>

      <OppholdStil />
    </main>
  );
}

function Bolk({
  tittel,
  children,
}: {
  tittel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="vh-bolk">
      <h2 className="vh-bolk-tittel">{tittel}</h2>
      <div className="vh-bolk-inn">{children}</div>
    </section>
  );
}

function Rad({
  navn,
  verdi,
  varsel,
}: {
  navn: string;
  verdi: string;
  varsel?: boolean;
}) {
  return (
    <div className="vh-rad">
      <span className="vh-rad-navn">{navn}</span>
      <span className={`vh-rad-verdi ${varsel ? "vh-rad-verdi--varsel" : ""}`}>
        {verdi}
      </span>
    </div>
  );
}

/**
 * Kopier ferdig melding → bekreft sendt. Samme to-stegs-flyt som på dashbordet,
 * men i husets språk, og den blir stående på oppholdssiden etterpå.
 */
function GjestelenkeKnapp({
  bookingId,
  gjest,
  lenke,
  sendt,
}: {
  bookingId: string;
  gjest: string;
  lenke: string;
  sendt: boolean;
}) {
  const [kopiert, setKopiert] = useState(false);
  const melding = `Hei ${gjest}! Her er din digitale gjesteside for oppholdet — innsjekk, WiFi, dørkode og alt du trenger på ett sted:\n${lenke}\n\nHi! Here's your digital guest page with check-in info, WiFi and everything for your stay:\n${lenke}`;

  if (sendt && !kopiert) {
    return (
      <button
        type="button"
        className="vh-opp-liten"
        onClick={async () => {
          await navigator.clipboard.writeText(melding);
          setKopiert(true);
        }}
      >
        Kopier meldingen på nytt
      </button>
    );
  }

  if (!kopiert) {
    return (
      <button
        type="button"
        className="vh-opp-liten vh-opp-liten--gull"
        onClick={async () => {
          await navigator.clipboard.writeText(melding);
          setKopiert(true);
        }}
      >
        Kopier melding til gjesten
      </button>
    );
  }

  return (
    <form action={markGuestLinkSent} className="vh-opp-bekreft">
      <span className="vh-opp-kopiert">Kopiert ✓</span>
      <input type="hidden" name="id" value={bookingId} />
      <input type="hidden" name="next" value={`/hjem/opphold/${bookingId}`} />
      {!sendt && (
        <button type="submit" className="vh-opp-liten vh-opp-liten--gull">
          Bekreft sendt
        </button>
      )}
    </form>
  );
}

function OppholdStil() {
  return (
    <style>{`
.vh-opp{position:relative;min-height:100dvh;background:#04111f;color:#f5f7fa;overflow-x:hidden;
  font-family:var(--font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif);
  padding:clamp(26px,5vh,54px) clamp(20px,5vw,60px) 132px}
.vh-opp-lys{position:fixed;inset:0;pointer-events:none;background:
  radial-gradient(110% 70% at 50% -10%,rgba(216,166,106,.14),transparent 60%),
  linear-gradient(180deg,#0a2038 0%,#04111f 58%)}
.vh-opp>*:not(.vh-opp-lys){position:relative;z-index:1}

.vh-opp-topp{max-width:680px;margin:0 auto;text-align:center}
.vh-opp-tilbake{display:inline-block;font-size:12px;letter-spacing:.12em;color:#6b7a8f;
  text-decoration:none;transition:color .4s}
.vh-opp-tilbake:hover{color:#d8a66a}
.vh-opp-fase{margin-top:18px;font-size:11px;font-weight:600;letter-spacing:.26em;
  text-transform:uppercase;color:#d8a66a}
.vh-opp-fase--venter{color:#f0a89a}
.vh-opp-fase--her{color:#7fb79a}
.vh-opp-fase--ferdig,.vh-opp-fase--avlyst{color:#6b7a8f}
.vh-opp-navn{margin-top:10px;font-size:clamp(28px,5vw,46px);font-weight:300;line-height:1.08;
  color:#f5f7fa;text-wrap:balance}
.vh-opp-under{margin-top:10px;font-size:14px;color:#93a3b8;text-wrap:balance}

.vh-opp-beskjed{max-width:620px;margin:26px auto 0;padding:18px 22px;border-radius:16px;
  background:rgba(245,247,250,.04);border-left:2px solid #d8a66a}
.vh-opp-beskjed p{font-size:16px;font-weight:300;line-height:1.6;color:#f5f7fa}
.vh-opp-beskjed footer{margin-top:9px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;
  color:#6b7a8f}

.vh-opp-tråd{max-width:680px;margin:clamp(28px,5vh,48px) auto 0}
.vh-bolk{padding:24px 0;border-top:1px solid rgba(216,166,106,.18)}
.vh-bolk-tittel{font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;
  color:#d8a66a}
.vh-bolk-inn{margin-top:14px;display:flex;flex-direction:column;gap:2px}

.vh-rad{display:flex;align-items:baseline;justify-content:space-between;gap:16px;padding:10px 4px;
  border-bottom:1px solid rgba(245,247,250,.05)}
.vh-rad-navn{font-size:14px;color:#93a3b8}
.vh-rad-verdi{font-size:15px;color:#f5f7fa;text-align:right}
.vh-rad-verdi--varsel{color:#e9c48d}

.vh-lenke-blokk{display:flex;flex-direction:column;gap:10px}
.vh-opp-liten{align-self:flex-start;font:inherit;font-size:13px;padding:9px 16px;border-radius:999px;
  cursor:pointer;background:none;color:#93a3b8;border:1px solid rgba(216,166,106,.2);
  transition:color .4s,border-color .4s}
.vh-opp-liten:hover{color:#f5f7fa;border-color:rgba(216,166,106,.46)}
.vh-opp-liten--gull{background:linear-gradient(180deg,#f2c38b,#d8a66a);color:#04111f;font-weight:600;
  border-color:transparent}
.vh-opp-liten--gull:hover{color:#04111f}
.vh-opp-bekreft{display:flex;align-items:center;gap:10px}
.vh-opp-kopiert{font-size:13px;color:#7fb79a}

.vh-meldinger{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.vh-melding{padding:13px 16px;border-radius:14px;max-width:88%}
.vh-melding--inn{background:rgba(245,247,250,.055);align-self:flex-start;
  border:1px solid rgba(245,247,250,.07)}
.vh-melding--ut{background:rgba(216,166,106,.13);align-self:flex-end;
  border:1px solid rgba(216,166,106,.22)}
.vh-melding-tekst{font-size:15px;line-height:1.55;color:#f5f7fa;white-space:pre-line}
.vh-melding-meta{margin-top:7px;font-size:11px;letter-spacing:.05em;color:#6b7a8f}

.vh-opp-stille{font-size:14px;color:#55637a;font-style:italic}
.vh-opp-ut{display:inline-block;margin-top:16px;font-size:13px;color:#93a3b8;text-decoration:none;
  transition:color .4s}
.vh-opp-ut:hover{color:#d8a66a}

.vh-anm{margin-top:10px;padding:16px 18px;border-radius:14px;background:rgba(245,247,250,.04)}
.vh-anm-stjerner{font-size:17px;color:#f2c38b;letter-spacing:.1em}
.vh-anm-tom{color:#2c3a4d}
.vh-anm-tekst{margin-top:9px;font-size:15px;font-weight:300;line-height:1.6;color:#f5f7fa}

.vh-skader{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
.vh-skade{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:12px;
  text-decoration:none;font-size:14px;color:#f5f7fa;background:rgba(240,168,154,.08);
  border:1px solid rgba(240,168,154,.22);transition:border-color .4s}
.vh-skade:hover{border-color:rgba(240,168,154,.5)}
.vh-skade-belop{color:#f0a89a;white-space:nowrap}

.vh-opp-bunn{max-width:680px;margin:30px auto 0;display:flex;gap:10px;justify-content:center;
  flex-wrap:wrap}
.vh-opp-knapp{font-size:14px;padding:12px 22px;border-radius:999px;text-decoration:none;color:#93a3b8;
  border:1px solid rgba(216,166,106,.2);transition:color .4s,border-color .4s,transform .4s}
.vh-opp-knapp:hover{color:#f5f7fa;border-color:rgba(216,166,106,.46)}
.vh-opp-knapp--gull{background:linear-gradient(180deg,#f2c38b,#d8a66a);color:#04111f;font-weight:600;
  border-color:transparent}
.vh-opp-knapp--gull:hover{color:#04111f;transform:translateY(-1px)}
`}</style>
  );
}

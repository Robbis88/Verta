"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ORD — Vera som operativsystem, ikke som en boble i hjørnet.
 *
 * Ett felt midt på skjermen. Du spør med dine egne ord, og svaret kommer
 * strømmende i stor, rolig tekst. Bruker det eksisterende /api/chat-endepunktet
 * med context «portal», uendret — samme assistent som chat-widgeten, bare gitt
 * hele rommet i stedet for et hjørne.
 */

type Melding = { rolle: "meg" | "vera"; tekst: string };

const FORSLAG = [
  "Hvordan sender jeg gjestelenken?",
  "Hvor legger jeg inn en utgift?",
  "Hvordan kobler jeg Airbnb-kalenderen?",
  "Hva må jeg gjøre før skattemeldingen?",
];

export function OrdRom({ fornavn }: { fornavn: string }) {
  const felt = useRef<HTMLInputElement>(null);
  const [verdi, setVerdi] = useState("");
  const [samtale, setSamtale] = useState<Melding[]>([]);
  const [venter, setVenter] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  useEffect(() => {
    felt.current?.focus();
  }, []);

  async function send(tekst: string) {
    const melding = tekst.trim();
    if (!melding || venter) return;

    const historikk = [...samtale, { rolle: "meg" as const, tekst: melding }];
    setSamtale([...historikk, { rolle: "vera", tekst: "" }]);
    setVerdi("");
    setVenter(true);
    setFeil(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "portal",
          messages: historikk.map((m) => ({
            role: m.rolle === "meg" ? "user" : "assistant",
            content: m.tekst,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        setSamtale(historikk);
        setFeil("Jeg fikk ikke svar akkurat nå. Prøv igjen om litt.");
        return;
      }

      const leser = res.body.getReader();
      const dekoder = new TextDecoder();
      let svar = "";
      for (;;) {
        const { done, value } = await leser.read();
        if (done) break;
        svar += dekoder.decode(value, { stream: true });
        setSamtale([...historikk, { rolle: "vera", tekst: svar }]);
      }
    } catch {
      setSamtale(historikk);
      setFeil("Jeg fikk ikke svar akkurat nå. Prøv igjen om litt.");
    } finally {
      setVenter(false);
      felt.current?.focus();
    }
  }

  const tomt = samtale.length === 0;

  return (
    <main className="vh-ord">
      <div className="vh-ord-lys" aria-hidden="true" />

      <div className="vh-ord-midt">
        <div className="vh-ord-kule" aria-hidden="true" />
        <p className="vh-ord-navn">Vera</p>

        {tomt ? (
          <h1 className="vh-ord-sporsmal">
            {fornavn ? `Hva lurer du på, ${fornavn}?` : "Hva lurer du på?"}
          </h1>
        ) : (
          <div className="vh-ord-samtale" aria-live="polite">
            {samtale.map((m, i) => (
              <p
                key={i}
                className={m.rolle === "meg" ? "vh-ord-meg" : "vh-ord-vera"}
              >
                {m.tekst || (venter ? "…" : "")}
              </p>
            ))}
          </div>
        )}

        <form
          className="vh-ord-form"
          onSubmit={(e) => {
            e.preventDefault();
            send(verdi);
          }}
        >
          <input
            ref={felt}
            value={verdi}
            onChange={(e) => setVerdi(e.target.value)}
            placeholder="Skriv det på din egen måte …"
            aria-label="Spør Vera"
            className="vh-ord-felt"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={venter || !verdi.trim()}
            className="vh-ord-send"
            aria-label="Send"
          >
            {venter ? "…" : "→"}
          </button>
        </form>

        {feil && <p className="vh-ord-feil">{feil}</p>}

        {tomt && !venter && (
          <ul className="vh-ord-forslag">
            {FORSLAG.map((f) => (
              <li key={f}>
                <button type="button" onClick={() => send(f)}>
                  {f}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!tomt && !venter && (
          <button
            type="button"
            className="vh-ord-nullstill"
            onClick={() => {
              setSamtale([]);
              setFeil(null);
              felt.current?.focus();
            }}
          >
            Start på nytt
          </button>
        )}
      </div>

      <OrdStil />
    </main>
  );
}

function OrdStil() {
  return (
    <style>{`
.vh-ord{position:relative;min-height:100dvh;display:grid;place-items:center;background:#04111f;
  color:#f5f7fa;padding:clamp(30px,6vh,64px) clamp(20px,5vw,60px) 132px;overflow-x:hidden;
  font-family:var(--font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif)}
.vh-ord-lys{position:fixed;inset:0;pointer-events:none;background:
  radial-gradient(70% 55% at 50% 32%,rgba(216,166,106,.18),transparent 62%),
  linear-gradient(180deg,#0a2038 0%,#04111f 64%)}
.vh-ord-midt{position:relative;z-index:1;width:min(700px,100%);text-align:center}

.vh-ord-kule{width:62px;height:62px;margin:0 auto;border-radius:50%;
  background:radial-gradient(circle at 34% 30%,#fbeacd,#d8a66a 54%,#a97e46 100%);
  box-shadow:0 0 60px rgba(216,166,106,.45);animation:vhOrdPust 6s ease-in-out infinite}
@keyframes vhOrdPust{0%,100%{transform:scale(1);box-shadow:0 0 60px rgba(216,166,106,.45)}
  50%{transform:scale(1.05);box-shadow:0 0 80px rgba(216,166,106,.6)}}
.vh-ord-navn{margin-top:16px;font-size:11px;font-weight:600;letter-spacing:.34em;
  text-transform:uppercase;color:#d8a66a;padding-left:.34em}
.vh-ord-sporsmal{margin-top:12px;font-size:clamp(27px,4.8vw,44px);font-weight:300;line-height:1.1;
  color:#f5f7fa;text-wrap:balance}

.vh-ord-samtale{margin-top:24px;max-height:46vh;overflow-y:auto;text-align:left;
  display:flex;flex-direction:column;gap:16px;padding:4px 2px;
  scrollbar-width:thin;scrollbar-color:rgba(216,166,106,.3) transparent}
.vh-ord-meg{font-size:15px;color:#6b7a8f}
.vh-ord-meg::before{content:"Du: ";font-weight:600;color:#93a3b8}
.vh-ord-vera{font-size:clamp(17px,2.3vw,21px);font-weight:300;line-height:1.55;color:#f5f7fa;
  white-space:pre-line}

.vh-ord-form{margin-top:clamp(24px,4vh,36px);display:flex;align-items:center;gap:12px;
  border-bottom:1px solid rgba(216,166,106,.32);padding:0 4px 12px;transition:border-color .5s}
.vh-ord-form:focus-within{border-color:rgba(216,166,106,.65)}
.vh-ord-felt{flex:1;min-width:0;background:none;border:none;outline:none;color:#f5f7fa;font:inherit;
  font-weight:300;font-size:clamp(16px,2.4vw,21px);text-align:center}
.vh-ord-felt::placeholder{color:#46566d}
.vh-ord-send{flex:none;width:42px;height:42px;border-radius:50%;cursor:pointer;font-size:17px;
  background:linear-gradient(180deg,#f2c38b,#d8a66a);color:#04111f;border:none;
  transition:transform .4s cubic-bezier(.2,.7,.2,1),opacity .4s}
.vh-ord-send:disabled{opacity:.3;cursor:default}
.vh-ord-send:not(:disabled):hover{transform:scale(1.06)}

.vh-ord-feil{margin-top:16px;font-size:14px;color:#f0a89a}

.vh-ord-forslag{list-style:none;margin:24px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:9px;
  justify-content:center}
.vh-ord-forslag button{background:none;border:1px solid rgba(216,166,106,.16);border-radius:999px;
  padding:9px 16px;font:inherit;font-size:13px;color:#93a3b8;cursor:pointer;
  transition:color .4s,border-color .4s}
.vh-ord-forslag button:hover{color:#f5f7fa;border-color:rgba(216,166,106,.44)}

.vh-ord-nullstill{margin-top:22px;background:none;border:none;cursor:pointer;font:inherit;
  font-size:13px;letter-spacing:.1em;color:#6b7a8f;transition:color .4s}
.vh-ord-nullstill:hover{color:#d8a66a}

@media (prefers-reduced-motion:reduce){
  .vh-ord-kule{animation:none}
}
`}</style>
  );
}

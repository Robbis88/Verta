"use client";

import { useState } from "react";

import { feltKlasse, Flate, Handling, Kort } from "@/components/hus";

const EXAMPLES = [
  "Hva kostet hytten oss i 2025?",
  "Hvor mye har vi brukt på strøm siste 12 måneder?",
  "Hvor mye skylder medeierne hverandre?",
  "Kan vi tåle høyere rente?",
  "Hvor mye kan denne eiendommen hjelpe oss ved kjøp av neste?",
  "Hvilke kostnader bør vi redusere?",
  "Hva er netto kontantstrøm etter skatt?",
];

/**
 * AI-assistent for eiendomsøkonomi. Fortsatt mockup — men nå ærlig om det,
 * og i husets språk. Ingen funksjonell endring.
 */
export function AiBox() {
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState(false);

  return (
    <Flate
      tittel="Spør Verta om økonomien"
      hva="Kommer snart — koblet til dine faktiske tall: bookinger, utgifter, lån og skatt."
    >
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQ(ex);
              setAsked(false);
            }}
            className="rounded-full border border-hus-linje px-3 py-1.5 text-xs text-hus-dempet transition-colors hover:border-hus-linje-sterk hover:text-hus-blekk"
          >
            {ex}
          </button>
        ))}
      </div>

      <textarea
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAsked(false);
        }}
        rows={2}
        aria-label="Spørsmål om økonomien"
        placeholder="Skriv et spørsmål om hyttas økonomi …"
        className={`${feltKlasse} mt-4 h-auto py-3 leading-relaxed`}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Handling
          vekt="gull"
          disabled={!q.trim()}
          onClick={() => setAsked(true)}
        >
          Spør
        </Handling>
        <span className="text-xs text-hus-svak">
          AI-svar med ekte tall kommer snart.
        </span>
      </div>

      {asked && (
        <div className="mt-4">
          <Kort>
            <p className="text-sm text-hus-gull-lys">Verta jobber med dette</p>
            <p className="mt-1.5 text-sm leading-relaxed text-hus-dempet">
              Snart kobler vi assistenten til dine faktiske tall — bookinger,
              utgifter, lån og skatt — så du får svar på «{q.trim()}» direkte.
            </p>
          </Kort>
        </div>
      )}
    </Flate>
  );
}

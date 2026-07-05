"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const EXAMPLES = [
  "Hva kostet hytten oss i 2025?",
  "Hvor mye har vi brukt på strøm siste 12 måneder?",
  "Hvor mye skylder medeierne hverandre?",
  "Kan vi tåle høyere rente?",
  "Hvor mye kan denne eiendommen hjelpe oss ved kjøp av neste?",
  "Hvilke kostnader bør vi redusere?",
  "Hva er netto kontantstrøm etter skatt?",
];

/** AI-assistent for eiendomsøkonomi. Mockup nå — UI klart for ekte data. */
export function AiBox() {
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState(false);

  return (
    <Card className="border-gold/40 bg-gradient-to-br from-cloud to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden>✨</span> Spør Verta om økonomien
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setQ(ex);
                setAsked(false);
              }}
              className="rounded-full border border-hairline bg-white px-3 py-1 text-xs text-ink hover:border-gold hover:text-navy"
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
          placeholder="Skriv et spørsmål om hyttas økonomi…"
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm"
        />

        <div className="flex items-center gap-3">
          <Button
            type="button"
            disabled={!q.trim()}
            onClick={() => setAsked(true)}
          >
            Spør
          </Button>
          <span className="text-xs text-muted-foreground">
            AI-svar med ekte tall kommer snart.
          </span>
        </div>

        {asked && (
          <div className="rounded-lg border border-gold/30 bg-white p-3 text-sm text-ink">
            <p className="font-medium text-navy">Verta jobber med dette 🛠️</p>
            <p className="mt-1 text-muted-foreground">
              Snart kobler vi assistenten til dine faktiske tall — bookinger,
              utgifter, lån og skatt — så du får svar på «{q.trim()}» direkte.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

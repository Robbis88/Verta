"use client";

import { Handling } from "@/components/hus";

/** Skriver ut skatterapporten. Utskriftsstilen ligger i app/globals.css. */
export function PrintButton() {
  return (
    <Handling vekt="gull" onClick={() => window.print()}>
      Skriv ut / lagre som PDF
    </Handling>
  );
}

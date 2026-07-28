"use client";

import { useState } from "react";

import { Handling } from "@/components/hus";

/**
 * Kopier-knapp i husets språk. Egen fra components/shared/copy-button, som
 * fortsatt brukes av admin-sidene (lys flate) og derfor ikke skal endres.
 */
export function Kopier({
  tekst,
  merke = "Kopier lenke",
}: {
  tekst: string;
  merke?: string;
}) {
  const [kopiert, setKopiert] = useState(false);
  return (
    <Handling
      vekt="naken"
      onClick={async () => {
        await navigator.clipboard.writeText(tekst);
        setKopiert(true);
        setTimeout(() => setKopiert(false), 1500);
      }}
    >
      {kopiert ? "Kopiert ✓" : merke}
    </Handling>
  );
}

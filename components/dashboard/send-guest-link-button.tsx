"use client";

import { useState } from "react";

import { Handling } from "@/components/hus";
import { markGuestLinkSent } from "@/app/dashboard/alert-actions";

/**
 * Ett flytende steg for gjestelenke-påminnelsen: «Kopier melding» kopierer
 * teksten og bytter så til «Bekreft sendt», som markerer bookingen som sendt.
 * Slik slipper eieren en egen alltid-synlig knapp — bekreftelsen kommer først
 * etter at meldingen faktisk er kopiert.
 */
export function SendGuestLinkButton({
  bookingId,
  message,
}: {
  bookingId: string;
  message: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!copied) {
    return (
      <Handling
        type="button"
        vekt="naken"
        onClick={async () => {
          await navigator.clipboard.writeText(message);
          setCopied(true);
        }}
      >
        Kopier melding
      </Handling>
    );
  }

  return (
    <form action={markGuestLinkSent} className="flex items-center gap-2">
      <span className="text-xs text-hus-god">Kopiert ✓</span>
      <input type="hidden" name="id" value={bookingId} />
      <Handling type="submit" vekt="naken" className="text-hus-god">
        Bekreft sendt
      </Handling>
    </form>
  );
}

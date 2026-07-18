"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={async () => {
          await navigator.clipboard.writeText(message);
          setCopied(true);
        }}
      >
        Kopier melding
      </Button>
    );
  }

  return (
    <form action={markGuestLinkSent} className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-emerald-700">Kopiert ✓</span>
      <input type="hidden" name="id" value={bookingId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-emerald-700 hover:text-emerald-800"
      >
        Bekreft sendt
      </Button>
    </form>
  );
}

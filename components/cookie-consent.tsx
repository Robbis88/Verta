"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

import { saveConsent } from "@/lib/actions/gdpr";
import { Button } from "@/components/ui/button";

// Klient-kun: leser cookie uten å trigge setState-i-effect eller hydrerings-mismatch.
const subscribe = () => () => {};
function useConsentMissing() {
  return useSyncExternalStore(
    subscribe,
    () => !document.cookie.includes("verta_consent="),
    () => false,
  );
}

export function CookieConsent() {
  const missing = useConsentMissing();
  const [dismissed, setDismissed] = useState(false);

  if (!missing || dismissed) return null;

  async function choose(accepted: boolean) {
    await saveConsent(accepted, accepted);
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Vi bruker informasjonskapsler for å forbedre tjenesten. Les mer i{" "}
          <Link href="/personvern" className="underline">
            personvernerklæringen
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => choose(false)}>
            Kun nødvendige
          </Button>
          <Button size="sm" onClick={() => choose(true)}>
            Godta alle
          </Button>
        </div>
      </div>
    </div>
  );
}

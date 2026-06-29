"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    void fetch("/api/feil", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        alvorlighet: "warning",
        tittel: `Feil på side: ${error.message}`,
        detaljer: {
          melding: error.message,
          digest: error.digest,
          sti: typeof window !== "undefined" ? window.location.pathname : null,
        },
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Noe gikk galt</h1>
      <p className="max-w-sm text-muted-foreground">
        Beklager, en uventet feil oppstod. Prøv igjen.
      </p>
      <Button onClick={reset}>Prøv igjen</Button>
    </main>
  );
}

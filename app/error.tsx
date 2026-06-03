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

import Link from "next/link";
import { headers } from "next/headers";

import { Button } from "@/components/ui/button";
import { loggHendelse } from "@/lib/kontrollrom";

export default async function NotFound() {
  const h = await headers();
  await loggHendelse({
    type: "feil",
    alvorlighet: "info",
    tittel: "404 – side ikke funnet",
    detaljer: {
      referer: h.get("referer") ?? null,
      bruker_agent: h.get("user-agent") ?? null,
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-semibold text-gold">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Siden finnes ikke
      </h1>
      <p className="max-w-sm text-muted-foreground">
        Vi fant ikke siden du lette etter.
      </p>
      <Button asChild>
        <Link href="/">Til forsiden</Link>
      </Button>
    </main>
  );
}

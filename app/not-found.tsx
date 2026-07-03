import Link from "next/link";
import { headers } from "next/headers";

import { Button } from "@/components/ui/button";
import { loggHendelse } from "@/lib/kontrollrom";

/** True bare når 404-en kom fra en lenke på vårt eget domene. */
function fraEgenSide(referer: string | null, host: string | null): boolean {
  if (!referer || !host) return false;
  try {
    return new URL(referer).host === host;
  } catch {
    return false;
  }
}

export default async function NotFound() {
  const h = await headers();
  const referer = h.get("referer");

  // Logg KUN 404 fra egen side (ekte brutt lenke). Bot-skanning/direkte-treff
  // (ingen/ekstern referer) er støy og ignoreres.
  if (fraEgenSide(referer, h.get("host"))) {
    await loggHendelse({
      type: "feil",
      alvorlighet: "warning",
      tittel: "404 – brutt intern lenke",
      detaljer: {
        referer,
        bruker_agent: h.get("user-agent") ?? null,
      },
    });
  }

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

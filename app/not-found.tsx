import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
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

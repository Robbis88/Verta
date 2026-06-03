import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-navy px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          Full kontroll over dine utleieeiendommer
        </h1>
        <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-gold-light md:text-2xl">
          Enkel kalender, direkte bookinger, smartere markedsføring, skatt på
          autopilot.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            asChild
            className="h-auto rounded-lg bg-gold px-8 py-4 text-base font-semibold text-navy hover:bg-gold/90"
          >
            <Link href="/login">Kom i gang gratis</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="hidden h-auto rounded-lg border-2 border-gold bg-transparent px-8 py-4 text-base font-semibold text-white hover:bg-gold/10 hover:text-white sm:inline-flex dark:bg-transparent"
          >
            <Link href="#priser">Se pris</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

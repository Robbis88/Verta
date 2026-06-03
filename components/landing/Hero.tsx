import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { IMG } from "@/lib/images";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Image
        src={IMG.hero}
        alt="Norsk hytte ved fjorden i Lofoten"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/65 to-navy/90" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          Full kontroll over dine utleieeiendommer
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-gold-light md:text-xl">
          Enkel kalender, direkte bookinger, smartere markedsføring og skatt på
          autopilot — for norske hytter og leiligheter.
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
            className="h-auto rounded-lg border-2 border-white/40 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur hover:bg-white/15 hover:text-white dark:bg-white/5"
          >
            <Link href="#priser">Se priser</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Full kontroll over dine utleieeiendommer
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Enkel kalender, direkte bookinger, smartere markedsføring og skatt på
          autopilot — for norske hytte- og leilighetseiere.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/login">Kom i gang</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard">Til dashbordet</Link>
        </Button>
      </div>
    </main>
  );
}

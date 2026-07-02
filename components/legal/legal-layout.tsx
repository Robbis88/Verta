import Link from "next/link";

import { COMPANY } from "@/lib/company";

/** Felles ramme for de juridiske sidene (personvern, vilkår, databehandleravtale). */
export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Til forsiden
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sist oppdatert {COMPANY.lastUpdated}
      </p>
      <div className="mt-8 flex flex-col gap-4 text-ink">{children}</div>
    </main>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-4 text-xl font-semibold text-navy">{children}</h2>
  );
}

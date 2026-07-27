"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { navGrupper } from "@/lib/nav-items";

/**
 * Toppen av dashbordet — døra til «Alt».
 *
 * Før sto 19 lenker permanent fremme (tre på rot + fire nedtrekk). Nå står det
 * ett ord: Alt. Trykk, og hele modul-listen glir ned, gruppert og med en linje
 * om hva hver modul er til. Ingen modul er fjernet — tvert imot dukker tre som
 * aldri lå i menyen (Smartlås, Skade, Boost) opp her, fra lib/nav-items.ts.
 *
 * Panelet lukker seg selv ved navigasjon, klikk utenfor og Escape.
 */
export function DashboardNav({
  email,
  isAdmin,
}: {
  email?: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [apen, setApen] = useState(false);

  // Lukk ved navigasjon. Bevisst sync til route (samme mønster som før).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setApen(false), [pathname]);

  useEffect(() => {
    if (!apen) return;
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setApen(false);
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [apen]);

  const grupper = navGrupper(!!isAdmin);

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/hjem"
            className="text-sm text-white/60 transition-colors hover:text-gold"
            title="Tilbake til huset"
          >
            ← Huset
          </Link>
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-gold"
          >
            Verta
          </Link>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setApen((v) => !v)}
            aria-expanded={apen}
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-white/80 transition-colors hover:border-gold/50 hover:text-white"
          >
            <span className="flex flex-col gap-[3px]" aria-hidden="true">
              <i className="block h-px w-4 bg-gold" />
              <i className="block h-px w-4 bg-gold" />
              <i className="block h-px w-4 bg-gold" />
            </span>
            Alt
          </button>
          <span className="hidden text-white/50 sm:inline">{email}</span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-white/70 hover:text-white">
              Logg ut
            </button>
          </form>
        </div>
      </div>

      {apen && (
        <>
          {/* Klikk utenfor lukker. */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setApen(false)}
            role="presentation"
          />
          <div
            className="absolute left-0 right-0 top-full z-40 mt-3 max-h-[75vh] overflow-y-auto rounded-2xl border border-white/10 bg-navy-dark p-6 shadow-2xl"
            role="dialog"
            aria-label="Alt i systemet"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grupper.map((g) => (
                <section key={g.id}>
                  <h2 className="border-b border-gold/20 pb-2 text-sm font-semibold text-gold-light">
                    {g.tittel}
                  </h2>
                  <p className="mt-1 text-[11px] text-white/40">{g.hva}</p>
                  <ul className="mt-2 flex flex-col">
                    {g.items.map((i) => (
                      <li key={i.href}>
                        <Link
                          href={i.href}
                          className="block rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
                        >
                          <span className="block text-sm text-white/90">
                            {i.label}
                          </span>
                          <span className="block text-[11px] leading-snug text-white/40">
                            {i.hint}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

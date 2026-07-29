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
            className="text-sm text-hus-svak transition-colors hover:text-hus-gull"
            title="Tilbake til huset"
          >
            ← Huset
          </Link>
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-hus-gull"
          >
            Verta
          </Link>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setApen((v) => !v)}
            aria-expanded={apen}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-hus-linje px-4 py-1.5 text-hus-dempet transition-colors hover:border-hus-linje-sterk hover:text-hus-blekk"
          >
            <span className="flex flex-col gap-[3px]" aria-hidden="true">
              <i className="block h-px w-4 bg-hus-gull" />
              <i className="block h-px w-4 bg-hus-gull" />
              <i className="block h-px w-4 bg-hus-gull" />
            </span>
            Alt
          </button>
          <span className="hidden text-hus-svak sm:inline">{email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="cursor-pointer text-hus-dempet transition-colors hover:text-hus-blekk"
            >
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
            className="absolute left-0 right-0 top-full z-40 mt-3 max-h-[75vh] overflow-y-auto rounded-2xl border border-hus-linje bg-hus-hev p-6 shadow-2xl"
            role="dialog"
            aria-label="Alt i systemet"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grupper.map((g) => (
                <section key={g.id}>
                  <h2 className="border-b border-hus-linje pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-hus-gull">
                    {g.tittel}
                  </h2>
                  <p className="mt-1.5 text-[11px] text-hus-svak">{g.hva}</p>
                  <ul className="mt-2 flex flex-col">
                    {g.items.map((i) => (
                      <li key={i.href}>
                        <Link
                          href={i.href}
                          className="block rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.04]"
                        >
                          <span className="block text-sm text-hus-blekk">
                            {i.label}
                          </span>
                          <span className="block text-[11px] leading-snug text-hus-svak">
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

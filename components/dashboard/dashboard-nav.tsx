"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Item = { href: string; label: string };
type Group = { label: string; items: Item[] };

const linkClass = "text-sm text-white/70 hover:text-white";

export function DashboardNav({
  email,
  isAdmin,
}: {
  email?: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Lukk nedtrekk ved navigasjon eller klikk utenfor.
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const groups: Group[] = [
    {
      label: "Drift",
      items: [
        { href: "/dashboard/meldinger", label: "Meldinger" },
        { href: "/dashboard/varsler", label: "Varsler" },
        { href: "/dashboard/rengjoring", label: "Rengjøring" },
        { href: "/dashboard/finn-vaskehjelp", label: "Finn vaskehjelp" },
        { href: "/dashboard/vedlikehold", label: "Vedlikehold" },
        { href: "/dashboard/lager", label: "Lager" },
      ],
    },
    {
      label: "Marked",
      items: [
        { href: "/dashboard/prising", label: "Prising" },
        { href: "/dashboard/boosts", label: "Boost" },
      ],
    },
    {
      label: "Økonomi",
      items: [
        { href: "/dashboard/utgifter", label: "Utgifter" },
        { href: "/dashboard/commissions", label: "Provisjon" },
        { href: "/dashboard/tax", label: "Skatt" },
      ],
    },
    {
      label: "Konto",
      items: [
        { href: "/dashboard/team", label: "Team" },
        { href: "/dashboard/sikkerhet", label: "Sikkerhet" },
        { href: "/dashboard/settings", label: "Innstillinger" },
        ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ],
    },
  ];

  return (
    <div
      ref={ref}
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Link href="/dashboard" className="mr-1 text-lg font-bold tracking-tight text-gold">
          Verta
        </Link>
        <Link href="/dashboard" className={linkClass}>
          Oversikt
        </Link>
        <Link href="/dashboard/properties" className={linkClass}>
          Eiendommer
        </Link>

        {groups.map((g) => (
          <div key={g.label} className="relative">
            <button
              type="button"
              onClick={() => setOpen(open === g.label ? null : g.label)}
              className={`flex items-center gap-1 ${linkClass}`}
            >
              {g.label}
              <span className="text-[10px]">▾</span>
            </button>
            {open === g.label && (
              <div className="absolute left-0 top-full z-20 mt-2 flex min-w-40 flex-col rounded-lg border border-white/10 bg-navy-dark py-1 shadow-xl">
                {g.items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    className="px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-4 text-sm">
        <span className="hidden text-white/60 sm:inline">{email}</span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-white/70 hover:text-white">
            Logg ut
          </button>
        </form>
      </div>
    </div>
  );
}
